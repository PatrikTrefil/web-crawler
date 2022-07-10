import { graphqlHTTP } from "express-graphql";
import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLList,
    GraphQLID,
    GraphQLString,
    GraphQLBoolean,
    GraphQLNonNull,
} from "graphql";
import { IWebPage, IWebsiteRecord } from "ts-types";
import IModel from "./IModel";

function makeGraphQLRecord(record: IWebsiteRecord) {
    return {
        ...record,
        identifier: record.id,
        regexp: record.boundaryRegex,
        id: undefined,
        boundaryRegex: undefined,
    };
}
type GraphQLRecord = ReturnType<typeof makeGraphQLRecord>;

function turnExecutionNodeIntoGraphQLNode(
    node: IWebPage,
    ownerRecord: GraphQLRecord
) {
    return {
        ...node,
        owner: ownerRecord,
        crawlTime: node.crawlTime?.toISOString(),
    };
}

export default function getGraphQLMiddleware(model: IModel) {
    const WebPageType = new GraphQLObjectType({
        name: "WebPage",
        fields: {
            identifier: {
                type: GraphQLNonNull(GraphQLID),
            },
            label: { type: GraphQLNonNull(GraphQLString) },
            url: { type: GraphQLNonNull(GraphQLString) },
            regexp: { type: GraphQLNonNull(GraphQLString) },
            tags: {
                type: GraphQLNonNull(
                    GraphQLList(GraphQLNonNull(GraphQLString))
                ),
            },
            active: { type: GraphQLNonNull(GraphQLBoolean) },
        },
    });

    const NodeType = new GraphQLObjectType({
        name: "Node",
        // fields are defined as a function, so we can reference NodeType
        fields: () => ({
            title: { type: GraphQLString },
            url: { type: GraphQLNonNull(GraphQLString) },
            crawlTime: { type: GraphQLString },
            links: {
                type: GraphQLNonNull(GraphQLList(GraphQLNonNull(NodeType))),
                resolve: async (parent) => {
                    const record = await model.getRecordById(
                        parent.owner.identifier
                    );
                    if (record === null) throw new Error("record not found");
                    const crawl = await model.getExecution(
                        record.lastExecutionId
                    );
                    if (crawl === null) throw new Error("crawl not found");
                    const thisNode = crawl.nodes.find(
                        (node) => node.url === parent.url
                    );
                    if (thisNode === undefined)
                        throw new Error("node not found");
                    return thisNode.links.map((link) => {
                        const otherNode = crawl.nodes.find(
                            (otherNode) => otherNode.url === link
                        );
                        if (otherNode !== undefined)
                            return turnExecutionNodeIntoGraphQLNode(
                                otherNode,
                                makeGraphQLRecord(record)
                            );
                    });
                },
            },
            owner: { type: GraphQLNonNull(WebPageType) },
        }),
    }) as GraphQLObjectType; // because of recursive types, we need to do an explicit cast

    const QueryType = new GraphQLObjectType({
        name: "RootQueryType",
        fields: {
            websites: {
                type: GraphQLList(WebPageType),
                resolve: async () => {
                    const recordIds = await model.getRecordIds();
                    const promises = [];
                    for (const recordId of recordIds)
                        promises.push(model.getRecordById(recordId));

                    const records = await Promise.all(promises);
                    const nonNullRecords = records.filter(
                        (record) => record !== null
                    ) as IWebsiteRecord[];
                    const recordsWithRenamedProps = nonNullRecords.map(
                        (record) => makeGraphQLRecord(record)
                    );
                    return recordsWithRenamedProps;
                },
            },
            nodes: {
                type: GraphQLList(NodeType),
                args: { webPages: { type: GraphQLList(GraphQLString) } },
                resolve: async (_, params: { webPages: string[] }) => {
                    const crawlIds = await model.getExecutionIds();

                    const promises = [];
                    for (const crawlId of crawlIds)
                        promises.push(model.getExecution(crawlId));
                    const allExecutions = await Promise.all(promises);
                    let executions: typeof allExecutions;
                    if (params.webPages === undefined)
                        executions = allExecutions;
                    else
                        executions = allExecutions.filter((execution) => {
                            if (execution)
                                return params.webPages.includes(
                                    execution.sourceRecordId
                                );
                            else return false;
                        });

                    const nodes: ReturnType<
                        typeof turnExecutionNodeIntoGraphQLNode
                    >[] = [];
                    for (const execution of executions) {
                        if (execution === null) continue;
                        const ownerRecord = await model.getRecordById(
                            execution.sourceRecordId
                        );
                        if (ownerRecord === null) continue;
                        if (execution)
                            nodes.push(
                                ...execution.nodes.map((node) =>
                                    turnExecutionNodeIntoGraphQLNode(
                                        node,
                                        makeGraphQLRecord(ownerRecord)
                                    )
                                )
                            );
                    }
                    return nodes;
                },
            },
        },
    });

    const graphqlSchema = new GraphQLSchema({
        query: QueryType,
    });

    const graphqlMiddleware = graphqlHTTP({
        schema: graphqlSchema,
        graphiql: true,
    });

    return graphqlMiddleware;
}
