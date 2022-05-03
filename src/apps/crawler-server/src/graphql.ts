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
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
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
        links: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(NodeType))) },
        owner: { type: GraphQLNonNull(WebPageType) },
    }),
}) as GraphQLObjectType; // because of recursive types, we need to do an explicit cast

const QueryType = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        websites: {
            type: GraphQLList(WebPageType),
            resolve: () => null,
        },
        nodes: {
            type: GraphQLList(NodeType),
            resolve: () => null,
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

export default graphqlMiddleware;
