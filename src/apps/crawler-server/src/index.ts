import express, { Request, Response } from "express";
const app = express();
const port = 4000;
import {runTest} from './execution-manager-test';

app.get("/", (req: Request, res: Response) => {
    res.send("Hello world!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


runTest();
