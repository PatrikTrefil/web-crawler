import {
    ICrawlExecution,
    IWebsiteRecord,
    IWebsiteRecordUpdate,
    IWebPage,
} from "ts-types";
import IModel from "./IModel";
import neo4j, { Driver, Transaction, DateTime, Integer } from "neo4j-driver";
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
                        periodicityInSeconds:
                            resObj.periodicityInSeconds.toNumber(),
                        isActive: resObj.isActive,
                        tags: resObj.tags,
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
        periodicityInSeconds = 0
    ): Promise<string> {
        const session = this.driver.session();
        const params = {
            url: url,
            boundaryRegex: boundaryRegex,
            label: label,
            isActive: isActive,
            tags: tags,
            periodicityInSeconds: neo4j.int(periodicityInSeconds),
        };
        let createdRecordId;
        try {
            const result = await session.run(
                `CREATE (record:Record {
                    id: apoc.create.uuid(),
                    url: $url,
                    boundaryRegex: $boundaryRegex,
                    periodicityInSeconds: $periodicityInSeconds,
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
            return this.getRecordById(id); // nothing to change
        const propertyChanges = []; // parts of the Cypher query
        const params: {
            id: string;
            url?: string;
            boundaryRegex?: string;
            periodicityInSeconds?: Integer;
            label?: string;
            isActive?: boolean;
            tags?: string[];
        } = { id: id };
        if (recordUpdate.url) {
            propertyChanges.push("url : $url");
            params.url = recordUpdate.url;
        }
        if (recordUpdate.boundaryRegex) {
            propertyChanges.push("boundaryRegex : $boundaryRegex");
            params.boundaryRegex = recordUpdate.boundaryRegex;
        }
        if (recordUpdate.periodicityInSeconds !== undefined) {
            propertyChanges.push(
                "periodicityInSeconds : $periodicityInSeconds"
            );
            params.periodicityInSeconds = neo4j.int(
                recordUpdate.periodicityInSeconds
            );
        }
        if (recordUpdate.label) {
            propertyChanges.push("label : $label");
            params.label = recordUpdate.label;
        }
        if (recordUpdate.isActive !== undefined) {
            propertyChanges.push("isActive : $isActive");
            params.isActive = recordUpdate.isActive;
        }
        if (recordUpdate.tags) {
            propertyChanges.push("tags : $tags");
            params.tags = recordUpdate.tags;
        }
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
                    periodicityInSeconds:
                        resObj.periodicityInSeconds.toNumber(),
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
            // delete all executions based on the record with given id
            const resultExecutions = await session.run(
                `MATCH (record:Record { id: $id })-[exec:Execution]->()
                 RETURN exec.id`,
                { id: id }
            );
            for (const record of resultExecutions.records) {
                const executionId = record.get("exec.id");
                await this.deleteExecution(executionId);
            }
            // now we delete the record
            const result = await session.run(
                `MATCH (record:Record { id: $id }) DETACH DELETE record`,
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
    public async getExecutionIds(): Promise<string[]> {
        const session = this.driver.session();
        let executionIds: string[];
        try {
            const result = await session.run(
                `MATCH (record:Record)-[execution:Execution]->(page:WebPage) RETURN execution.id`
            );
            executionIds = result.records.map((record) =>
                record.get("execution.id")
            );
        } catch (e) {
            session.close();
            throw e;
        } finally {
            session.close();
        }
        return executionIds;
    }
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
                 WITH link as linkToWebPage, toWebPage as webPage
                 OPTIONAL MATCH (webPage)-[:Link { crawlExecutionId: $crawlExecutionId }]->(toWebPage)
                 RETURN linkToWebPage, webPage, collect(toWebPage) as linksOutOfWebPage`, // OPTIONAL MATCH because some pages have no links out
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
                 RETURN DISTINCT toWebPage as webPage`,
                {
                    crawlExecutionId: crawlExecutionId,
                }
            );
            const crawledPages = crawledPagesResult.records.map((record) => {
                const webPage: IWebPage = {
                    url: record.get("webPage").properties.url,
                    links: record.get("linksOutOfWebPage")?.map(
                        (linkRes: {
                            properties: {
                                url: string;
                            };
                        }) => {
                            return linkRes.properties.url;
                        }
                    ),
                };
                const linkToWebPage = record.get("linkToWebPage").properties;
                const title = linkToWebPage.title;
                webPage.title = title;
                const { year, month, day, hour, minute, second, nanosecond } =
                    linkToWebPage.crawlTime;
                const crawlTime = new Date(
                    year.toInt(),
                    month.toInt() - 1,
                    day.toInt(),
                    hour.toInt(),
                    minute.toInt(),
                    second.toInt(),
                    nanosecond.toInt() / 1000000
                );
                webPage.crawlTime = crawlTime;
                return webPage;
            });
            const uncrawledPages = uncrawledPagesResult.records.map(
                (record) => {
                    return {
                        url: record.get("webPage").properties.url,
                        links: [],
                    };
                }
            );
            const unionWithUniqueUrl = [...crawledPages]; // some pages are consired crawled and uncrawled -> ignore duplicates
            for (const uncrawledPage of uncrawledPages) {
                if (
                    !crawledPages.find(
                        (crawledPage) => crawledPage.url === uncrawledPage.url
                    )
                )
                    unionWithUniqueUrl.push(uncrawledPage);
            }

            execution = {
                id: crawlExecutionId,
                nodes: unionWithUniqueUrl,
                startURL: startURLResult.records[0].get("webPage.url"),
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
