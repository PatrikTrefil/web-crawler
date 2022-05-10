import express, { Request, Response } from "express";
const app = express();
const port = 4000;

const api = express.Router();
app.use("/api", api);

api.get("/", (req: Request, res: Response) => {
    res.send("Hello world!");
});

app.listen(port, () => {
    console.log(`crawler-server listening on port ${port}`);
});
