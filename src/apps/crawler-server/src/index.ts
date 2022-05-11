import express, { Request, Response } from "express";
const app = express();
const port = 4000;

if (process.env.NODE_ENV === "production") {
    // disable logging
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const emptyFunc = () => {};
    console.log = emptyFunc;
    console.info = emptyFunc;
    console.debug = emptyFunc;
}

const api = express.Router();
app.use("/api", api);

api.get("/records", (req: Request, res: Response) => {
    res.send("records");
});

api.get("/records/:recordId(\\d+)", (req: Request, res: Response) => {
    res.send("record: " + req.params.recordId);
});

api.post("/records/:recordId(\\d+)", (req: Request, res: Response) => {
    res.send("record: " + req.params.recordId + " post");
});

api.put("/records/:recordId(\\d+)", (req: Request, res: Response) => {
    res.send("record: " + req.params.recordId + " put");
});

api.delete("/records/:recordId(\\d+)", (req: Request, res: Response) => {
    res.send("record: " + req.params.recordId + " delete");
});

api.get("/records/:recordId(\\d+)/start", (req: Request, res: Response) => {
    res.send("record: " + req.params.recordId + " start");
});

app.listen(port, () => {
    console.log(`crawler-server listening on port ${port}`);
});
