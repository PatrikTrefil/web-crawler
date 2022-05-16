import express, { NextFunction, Request, Response } from "express";
import { body, check, validationResult, query } from "express-validator";
import Model from "./model";

const app = express();
const port = 4000;
const model = new Model();

if (process.env.NODE_ENV === "production") {
    // disable logging
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const emptyFunc = () => {};
    console.log = emptyFunc;
    console.info = emptyFunc;
    console.debug = emptyFunc;
}

app.use(function logRequests(req: Request, _, next: NextFunction) {
    console.info(
        "[%s] %s - %s",
        req.method,
        req.url,
        new Date(Date.now()).toISOString()
    );
    next();
});

const api = express.Router();
app.use("/api", api);

api.get(
    "/records",
    query("filterByURL").optional().isURL(),
    query("filterByLabel").optional().isString(),
    query("filterByIsActive").optional().isArray(),
    check("filterByTags.*").notEmpty().isString(),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const unfilteredUnsortedIds = await model.getRecordIds();
        let resultIds: Array<string>;
        if (
            req.query.filterByURL ||
            req.query.filterByLabel ||
            req.query.filterByTag ||
            req.query.sortBy
        ) {
            const records = [];
            const filteringEnabled =
                req.query.filterByURL ||
                req.query.filterByLabel ||
                req.query.filterByTag;
            for (const id of unfilteredUnsortedIds) {
                const record = await model.getRecordById(id);
                if (record === null) continue;
                if (filteringEnabled) {
                    if (
                        req.query.filterByURL &&
                        record.url !== req.query.filterByURL
                    )
                        continue;
                    if (
                        req.query.filterByLabel &&
                        record.label !== req.query.filterByLabel
                    )
                        continue;
                    if (
                        req.query.filterByTag &&
                        record.tags.every((tag) =>
                            (req.query.filterByTag as Array<string>).includes(
                                tag
                            )
                        )
                    )
                        continue;
                }
                records.push(record);
            }
            if (req.query.sortBy) {
                // check
                records.every((item) => (req.query.sortBy as string) in item);
                // sort
                // @ts-ignore
                records.sort((item) => item[req.query.sortBy]);
            }
            resultIds = records.map((item) => item.id);
        } else {
            resultIds = unfilteredUnsortedIds;
        }

        res.send(resultIds);
    }
);

api.get(
    "/records/:recordId([0-9a-zA-Z-]+)",
    async (req: Request, res: Response) => {
        const record = await model.getRecordById(req.params.recordId);
        res.send(record);
    }
);

api.post(
    "/records/create",
    express.json(),
    body("url").isURL(),
    body("boundaryRegex").isString().notEmpty().custom(regexValidator),
    body("label").isString().notEmpty(),
    body("isActive").isBoolean(),
    body("tags").isArray(),
    check("tags.*").isString().notEmpty(),
    body("periodicityInSeconds")
        .optional()
        .isInt()
        .custom((value) => value >= 0),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const body = req.body;

        let recordId: string;
        if (body.periodicityInSeconds)
            recordId = await model.createRecord(
                body.url,
                body.boundaryRegex,
                body.label,
                body.isActive,
                body.tags,
                body.periodicityInSeconds
            );
        else
            recordId = await model.createRecord(
                body.url,
                body.boundaryRegex,
                body.label,
                body.isActive,
                body.tags
            );
        res.status(201);
        res.send({
            recordId: recordId,
        });
    }
);

api.put(
    "/records/:recordId([0-9a-zA-Z-]+)",
    express.json(),
    body("url").isURL(),
    body("boundaryRegex").isString().notEmpty().custom(regexValidator),
    body("label").isString().notEmpty(),
    body("isActive").isBoolean(),
    body("tags").isArray(),
    check("tags.*").isString().notEmpty(),
    body("periodicityInSeconds")
        .isInt()
        .custom((value) => value >= 0),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const body = req.body;
        const recordUpdate = {
            url: body.url,
            boundaryRegex: body.boundaryRegex,
            label: body.label,
            isActive: body.isActive,
            tags: body.tags,
        };
        const result = await model.updateRecord(
            req.params.recordId,
            recordUpdate
        );
        if (result) res.sendStatus(204);
        else res.sendStatus(404);
    }
);

api.delete(
    "/records/:recordId([0-9a-zA-Z-]+)",
    async (req: Request, res: Response) => {
        const result = await model.deleteRecord(req.params.recordId);
        if (result) res.sendStatus(204);
        else res.sendStatus(404);
    }
);

api.get(
    "/records/:recordId([0-9a-zA-Z-]+)/start",
    (req: Request, res: Response) => {
        res.send("record: " + req.params.recordId + " start");
    }
);

app.listen(port, () => {
    console.log(`crawler-server listening on port ${port}`);
});

function regexValidator(value: any) {
    try {
        new RegExp(value);
    } catch (e) {
        throw new Error("Invalid regex");
    }
    return true;
}
