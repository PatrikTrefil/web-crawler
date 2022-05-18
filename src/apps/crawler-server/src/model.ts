import {
    ICrawlExecution,
    IWebsiteRecord,
    IWebsiteRecordUpdate,
    IWebPage,
} from "ts-types";
import IModel from "./IModel";
import neo4j, { Driver, Transaction, DateTime } from "neo4j-driver";
import "dotenv/config";

export default class Model implements IModel {
    private driver: Driver;
    public constructor() {
        this.driver = neo4j.driver(
            process.env.NEO4J_URL as string,
            neo4j.auth.basic(
                process.env.NEO4J_USER as string,
                process.env.NEO4J_PASS as string
            )
        );
    }
    /**
     * NEEDS TO BE RUN FOR CLEAN EXIT OF THE APP
     */
    public async dispose() {
        await this.driver.close();
    }
    // #region WebsiteRecords
    public async getRecordById(id: string): Promise<IWebsiteRecord | null> {
        const session = this.driver.session();
        let websiteRecord: IWebsiteRecord | null;
        try {
            // we are using a transaction to always return a website record that has existed in the database at some point
            // if we did not use a transaction, we could get a website record in our first query, then someone else deletes
            // the website record and its lastExecution, then we query the lastExecution, we get null. We now return our websiteRecord
            // without the lastExecution and this situation never existed in the database.
            websiteRecord = await session.readTransaction(async (tx) => {
                const recordResult = await tx.run(
                    "MATCH (record:Record { id: $id }) RETURN record",
                    { id: id }
                );
                let record: IWebsiteRecord | null = null;
                if (recordResult.records.length > 0) {
                    const lastExecutionResult = await tx.run(
                        "MATCH (record:Record { id: $id })-[lastExecution:Execution]-(:WebPage) RETURN lastExecution.id ORDER BY lastExecution.crawlTime LIMIT 1",
                        { id: id }
                    );
                    const lastExecutionId =
                        lastExecutionResult.records.length > 0
                            ? lastExecutionResult.records[0].get(
                                  "lastExecution.id"
                              )
                            : null;
                    const resObj =
                        recordResult.records[0].get("record").properties;
                    record = {
                        id: resObj.id,
                        url: resObj.url,
                        boundaryRegex: resObj.boundaryRegex,
                        label: resObj.label,
                        isActive: resObj.isActive,
                        tags: resObj.tags,
                        periodicityInSeconds: resObj.periodicityInSeconds,
                        lastExecutionId: lastExecutionId,
                    };
                }
                return record;
            });
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return websiteRecord;
    }
    public async createRecord(
        url: string,
        boundaryRegex: string,
        label: string,
        isActive: boolean,
        tags: string[],
        periodicityInSeconds?: number
    ): Promise<string> {
        const session = this.driver.session();
        const params: IWebsiteRecordUpdate = {
            url: url,
            boundaryRegex: boundaryRegex,
            label: label,
            isActive: isActive,
            tags: tags,
        };
        if (periodicityInSeconds)
            params.periodicityInSeconds = periodicityInSeconds;
        let createdRecordId;
        try {
            const result = await session.run(
                `CREATE (record:Record {
                    id: apoc.create.uuid(),
                    url: $url,
                    boundaryRegex: $boundaryRegex${
                        params.periodicityInSeconds
                            ? ", periodicityInSeconds: $periodicityInSeconds"
                            : ""
                    },
                    label: $label,
                    isActive: $isActive,
                    tags: $tags })
                 RETURN record.id`,
                params
            );
            createdRecordId = result.records[0].get(0);
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return createdRecordId;
    }
    public async updateRecord(
        id: string,
        recordUpdate: IWebsiteRecordUpdate
    ): Promise<IWebsiteRecord | null> {
        if (
            !(
                recordUpdate.url ||
                recordUpdate.boundaryRegex ||
                recordUpdate.periodicityInSeconds ||
                recordUpdate.label ||
                recordUpdate.isActive ||
                recordUpdate.tags
            )
        )
            throw "No update parameters provided";
        const propertyChanges = []; // parts of the Cypher query
        const stringRecordUpdate: {
            url?: string;
            boundaryRegex?: string;
            periodicityInSeconds?: number;
            label?: string;
            isActive?: boolean;
            tags?: string[];
        } = {};
        if (recordUpdate.url) {
            propertyChanges.push("url : $url");
            stringRecordUpdate.url = recordUpdate.url;
        }
        if (recordUpdate.boundaryRegex) {
            propertyChanges.push("boundaryRegex : $boundaryRegex");
            stringRecordUpdate.boundaryRegex = recordUpdate.boundaryRegex;
        }
        if (recordUpdate.periodicityInSeconds) {
            propertyChanges.push(
                "periodicityInSeconds : $periodicityInSeconds"
            );
            stringRecordUpdate.periodicityInSeconds =
                recordUpdate.periodicityInSeconds;
        }
        if (recordUpdate.label) {
            propertyChanges.push("label : $label");
            stringRecordUpdate.label = recordUpdate.label;
        }
        if (recordUpdate.isActive) {
            propertyChanges.push("isActive : $isActive");
            stringRecordUpdate.isActive = recordUpdate.isActive;
        }
        if (recordUpdate.tags) {
            propertyChanges.push("tags : $tags");
            stringRecordUpdate.tags = recordUpdate.tags;
        }
        const params = { ...recordUpdate, id: id };
        const query =
            "MATCH (record: Record { id: $id }) SET record += { " +
            propertyChanges.join(", ") +
            " } RETURN record";
        const session = this.driver.session();
        let updatedRecord;
        try {
            const result = await session.run(query, params);
            if (result.records.length > 0) {
                const resObj = result.records[0].get(0).properties;
                updatedRecord = {
                    id: resObj.id,
                    url: resObj.url,
                    boundaryRegex: resObj.boundaryRegex,
                    label: resObj.label,
                    isActive: resObj.isActive,
                    tags: resObj.tags,
                    periodicityInSeconds: resObj.periodicityInSeconds,
                    lastExecutionId: resObj.lastExecutionId ?? null,
                };
            } else {
                updatedRecord = null;
            }
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return updatedRecord;
    }
    public async deleteRecord(id: string): Promise<boolean> {
        const session = this.driver.session();
        let nodesDeletedCount;
        try {
            const result = await session.run(
                "MATCH (record:Record { id: $id }) DETACH DELETE record",
                { id: id }
            );
            nodesDeletedCount =
                result.summary.counters.updates()["nodesDeleted"];
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return nodesDeletedCount === 1;
    }
    public async getRecordIds(): Promise<string[]> {
        const session = this.driver.session();
        let recordIds;
        try {
            const result = await session.run(
                "MATCH (record:Record) RETURN record.id"
            );
            recordIds = result.records.map((record) => record.get("record.id"));
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return recordIds;
    }
    // #endregion
    // #region Crawlexecutions
    /**
     * @returns true if the webpage was created; false if the webpage already exists
     */
    private async createWebPage(
        url: string,
        tx: Transaction
    ): Promise<boolean> {
        const result = await tx.run("MERGE (webpage:WebPage { url: $url })", {
            url: url,
        });
        const numberOfCreatedNodes =
            result.summary.counters.updates()["nodesCreated"];
        return numberOfCreatedNodes === 1;
    }
    public async createExecutionLink(
        websiteRecordId: string,
        webPageURL: string,
        title: string,
        crawlTime: Date
    ): Promise<string> {
        const session = this.driver.session();
        let createdExecutionLinkId;
        try {
            createdExecutionLinkId = await session.writeTransaction(
                async (tx) => {
                    await this.createWebPage(webPageURL, tx);
                    const result = await tx.run(
                        `MATCH (a:Record { id: $websiteRecordId }), (b:WebPage { url: $webPageURL })
                            MERGE
                                (a)-[l:Link { id : apoc.create.uuid() }]->(b)
                            MERGE
                                (a)-[e:Execution]->(b)
                            SET
                                e.crawlTime = $crawlTime,
                                e.id = apoc.create.uuid(),
                                l.title = $title,
                                l.crawlTime = $crawlTime,
                                l.crawlExecutionId = e.id
                            RETURN e.id`,
                        {
                            websiteRecordId: websiteRecordId,
                            webPageURL: webPageURL.toString(),
                            title: title,
                            crawlTime:
                                neo4j.types.DateTime.fromStandardDate(
                                    crawlTime
                                ),
                        }
                    );
                    if (result.records.length > 0)
                        return result.records[0].get("e.id");
                    else throw "websiteRecordId not found";
                }
            );
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return createdExecutionLinkId;
    }
    public async createLinkBetweenWebPages(
        fromWebPageURL: string,
        toWebPageURL: string,
        title: string | undefined,
        crawlTime: Date | undefined,
        crawlExecutionId: string
    ): Promise<string> {
        const session = this.driver.session();
        let createdLinkId;
        const params: {
            fromWebPageURL: string;
            toWebPageURL: string;
            crawlExecutionId: string;
            title?: string;
            crawlTime?: DateTime<number>;
        } = {
            fromWebPageURL: fromWebPageURL,
            toWebPageURL: toWebPageURL,
            crawlExecutionId: crawlExecutionId,
        };
        if (title) params.title = title;
        if (crawlTime)
            params.crawlTime = neo4j.types.DateTime.fromStandardDate(crawlTime);
        try {
            createdLinkId = await session.writeTransaction(async (tx) => {
                await this.createWebPage(fromWebPageURL, tx);
                await this.createWebPage(toWebPageURL, tx);
                const result = await tx.run(
                    `MATCH (fromWebPage:WebPage { url: $fromWebPageURL }), (toWebPage:WebPage { url: $toWebPageURL })
                    MERGE (fromWebPage)-[e:Link {
                        ${title ? "title : $title," : ""}
                        ${crawlTime ? "crawlTime : $crawlTime," : ""}
                        crawlExecutionId : $crawlExecutionId,
                        id : apoc.create.uuid()
                    }]->(toWebPage)
                    RETURN e.id`,
                    params
                );
                if (result.records.length > 0)
                    return result.records[0].get("e.id");
                else throw "Failed";
            });
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return createdLinkId;
    }
    public async deleteExecution(crawlExecutionId: string): Promise<boolean> {
        const session = this.driver.session();
        let success;
        try {
            success = await session.writeTransaction(async (tx) => {
                // delete webpages nodes (and their relationships) that were present only in execution with given executionId
                const lonelyWebpageDeleteResult = await tx.run(
                    `MATCH (webPage:WebPage) WHERE
                    exists(
                        (webPage)-[:Link { crawlExecutionId: $crawlExecutionId }]-()
                    ) AND
                    NOT EXISTS {
                        MATCH (webPage)-[r]-() WHERE NOT (r:Link AND r.crawlExecutionId = $crawlExecutionId)
                    }
                 DETACH DELETE webPage`,
                    { crawlExecutionId: crawlExecutionId }
                );
                const deleteAllLinksResult = await tx.run(
                    `MATCH (recordOrWebPage)-[link:Link { crawlExecutionId: $crawlExecutionId }]->(webpage:WebPage)
                 WHERE recordOrWebPage:Record OR recordOrWebPage:WebPage
                 DELETE link`,
                    { crawlExecutionId: crawlExecutionId }
                );
                const deleteExecutionRelationshipResult = await tx.run(
                    `MATCH (record:Record)-[rel:Execution { id: $crawlExecutionId }]->(webpage:WebPage)
                 DELETE rel`,
                    { crawlExecutionId: crawlExecutionId }
                );
                return (
                    lonelyWebpageDeleteResult.summary.counters.updates()[
                        "relationshipsDeleted"
                    ] > 0 ||
                    deleteAllLinksResult.summary.counters.updates()[
                        "relationshipsDeleted"
                    ] > 0 ||
                    deleteExecutionRelationshipResult.summary.counters.updates()[
                        "relationshipsDeleted"
                    ] > 0
                );
            });
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return success;
    }
    public async getExecution(
        crawlExecutionId: string
    ): Promise<ICrawlExecution | null> {
        const session = this.driver.session();
        let execution: ICrawlExecution | null;
        try {
            const startURLResult = await session.run(
                `MATCH (:Record)-[:Execution { id: $crawlExecutionId }]->(webPage:WebPage) RETURN webPage.url`,
                {
                    crawlExecutionId: crawlExecutionId,
                }
            );
            // no link of type Execution with crawlExecutionId was found
            if (startURLResult.records.length === 0) {
                session.close();
                return null;
            }
            // there might be multiple links going to the same webpage, but only one link (from one execution) contains the crawled data
            const crawledPagesResult = await session.run(
                `MATCH (fromNode)-[link:Link { crawlExecutionId: $crawlExecutionId }]->(toWebPage)
                 WHERE (fromNode:Record OR fromNode:WebPage) AND link.crawlTime IS NOT NULL AND link.title IS NOT NULL
                 RETURN link, toWebPage as webPage
                `,
                {
                    crawlExecutionId: crawlExecutionId,
                }
            );
            const uncrawledPagesResult = await session.run(
                `MATCH (toWebPage:WebPage)<-[:Link {crawlExecutionId: $crawlExecutionId }]-(fromNode)
                 WHERE
                    (fromNode:Record OR fromNode:WebPage) AND
                    NOT EXISTS {
                        MATCH (fromNode)-[link:Link { crawlExecutionId: $crawlExecutionId }]->(toWebPage)
                        WHERE (fromNode:Record OR fromNode:WebPage) AND link.crawlTime IS NOT NULL AND link.title IS NOT NULL
                    }
                 RETURN toWebPage as webPage`,
                {
                    crawlExecutionId: crawlExecutionId,
                }
            );
            const linksResult = await session.run(
                `MATCH (fromWebPage:WebPage)-[link:Link { crawlExecutionId: $crawlExecutionId }]->(toWebPage:WebPage)
                 RETURN DISTINCT fromWebPage, link, toWebPage`,
                {
                    crawlExecutionId: crawlExecutionId,
                }
            );
            const crawledPages = crawledPagesResult.records.map((record) => {
                const webPage: IWebPage = {
                    url: record.get("webPage").properties.url,
                };
                const title = record.get("link").properties.title;
                if (title !== null) webPage.title = title;
                const { year, month, day, hour, minute, second, nanosecond } =
                    record.get("link").properties.crawlTime;
                const crawlTime = new Date(
                    year.toInt(),
                    month.toInt() - 1,
                    day.toInt(),
                    hour.toInt(),
                    minute.toInt(),
                    second.toInt(),
                    nanosecond.toInt() / 1000000
                );
                if (crawlTime !== null) webPage.crawlTime = crawlTime;
                return webPage;
            });
            const uncrawledPages = uncrawledPagesResult.records.map(
                (record) => {
                    return {
                        url: record.get("webPage").properties.url,
                    };
                }
            );
            execution = {
                id: crawlExecutionId,
                nodes: [...crawledPages, ...uncrawledPages],
                startURL: startURLResult.records[0].get("webPage.url"),
                edges: linksResult.records.map((record) => {
                    const link: IWebPageLink = {
                        sourceURL: record.get("fromWebPage").properties.url,
                        destinationURL: record.get("toWebPage").properties.url,
                    };
                    return link;
                }),
            };
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return execution;
    }
    // #endregion
}
