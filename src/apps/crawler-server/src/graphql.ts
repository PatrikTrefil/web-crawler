import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";

const graphqlSchema = buildSchema(`
type Query {
    hello: String
}
`);

const root = { hello: () => "Hello world!" };

const graphqlMiddleware = graphqlHTTP({
    schema: graphqlSchema,
    rootValue: root,
    graphiql: true,
});

export default graphqlMiddleware;
