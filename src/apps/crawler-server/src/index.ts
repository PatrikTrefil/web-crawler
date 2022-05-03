import express from "express";
import graphqlMiddleware from "./graphql";

const app = express();
const port = 4000;

app.use("/graphql", graphqlMiddleware);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
