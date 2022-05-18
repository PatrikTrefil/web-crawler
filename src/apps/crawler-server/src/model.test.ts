import { ICrawlExecution } from "ts-types";
import Model from "./model";

// running these tests requires a database connection
// WARNING: this test will modify the database

// #region WebsiteRecords
test("add one website record", async () => {
    const model = new Model();
    const websiteRecord = {
        id: "",
        url: "http://google.com",
        boundaryRegex: ".*",
        label: "google",
        isActive: true,
        tags: ["general"],
        periodicityInSeconds: 60,
        lastExecutionId: null,
    };
    const id = await model.createRecord(
        websiteRecord.url,
        websiteRecord.boundaryRegex,
        websiteRecord.label,
        websiteRecord.isActive,
        websiteRecord.tags,
        websiteRecord.periodicityInSeconds
    );
    const res = await model.getRecordById(id);
    websiteRecord.id = id;
    await model.dispose();
    expect(res).toStrictEqual(websiteRecord);
});

test("add and delete website record", async () => {
    const model = new Model();
    const websiteRecord = {
        id: "",
        url: "http://google.com",
        boundaryRegex: ".*",
        label: "google",
        isActive: true,
        tags: ["general"],
        periodicityInSeconds: 60,
        lastExecutionId: null,
    };
    const id = await model.createRecord(
        websiteRecord.url,
        websiteRecord.boundaryRegex,
        websiteRecord.label,
        websiteRecord.isActive,
        websiteRecord.tags,
        websiteRecord.periodicityInSeconds
    );
    const success = await model.deleteRecord(id);
    const res = await model.getRecordById(id);
    await model.dispose();
    expect(success).toBe(true);
    expect(res).toBe(null);
});

test("add website record and update it", async () => {
    const model = new Model();
    const websiteRecord = {
        id: "",
        url: "http://google.com",
        boundaryRegex: ".*",
        label: "google",
        isActive: true,
        tags: ["general"],
        periodicityInSeconds: 60,
        lastExecutionId: null,
    };
    const id = await model.createRecord(
        websiteRecord.url,
        websiteRecord.boundaryRegex,
        websiteRecord.label,
        websiteRecord.isActive,
        websiteRecord.tags,
        websiteRecord.periodicityInSeconds
    );
    const res = await model.updateRecord(id, { label: "amazon" });
    websiteRecord.id = id;
    websiteRecord.label = "amazon";
    await model.dispose();
    expect(res).toStrictEqual(websiteRecord);
});

test("get a nonexistent website record by id", async () => {
    const model = new Model();
    const id = await model.getRecordById("nonexistent");
    await model.dispose();
    expect(id).toBe(null);
});

test("delete a nonexistent website record", async () => {
    const model = new Model();
    const success = await model.deleteRecord("nonexistent");
    await model.dispose();
    expect(success).toBe(false);
});
// #endregion
// #region CrawlExecutions
test("create execution with periodicity in seconds", async () => {
    const model = new Model();
    const websiteRecord = {
        id: "",
        url: "http://google.com",
        boundaryRegex: ".*",
        label: "google",
        isActive: true,
        tags: ["general"],
        periodicityInSeconds: 60,
        lastExecutionId: null,
    };
    const recordId = await model.createRecord(
        websiteRecord.url,
        websiteRecord.boundaryRegex,
        websiteRecord.label,
        websiteRecord.isActive,
        websiteRecord.tags,
        websiteRecord.periodicityInSeconds
    );
    const executionId = await model.createExecutionLink(
        recordId,
        "http://google.com",
        "Google",
        new Date("2020-01-01")
    );
    await model.createLinkBetweenWebPages(
        "http://google.com",
        "http://amazon.com",
        "Amazon",
        new Date("2020-01-01"),
        executionId
    );
    const expectedExecution: ICrawlExecution = {
        id: executionId,
        startURL: "http://google.com",
        nodes: [
            {
                url: "http://google.com",
                title: "Google",
                crawlTime: new Date("2020-01-01"),
            },
            {
                url: "http://amazon.com",
                title: "Amazon",
                crawlTime: new Date("2020-01-01"),
            },
        ],
        edges: [
            {
                sourceURL: "http://google.com",
                destinationURL: "http://amazon.com",
            },
        ],
    };
    const execution = await model.getExecution(executionId);
    if (execution === null) throw "Created execution not found;";
    await model.dispose();
    // converting arrays to sets for comparison ignoring order of elements
    const setExecution = {
        id: execution.id,
        startURL: execution.startURL,
        nodes: new Set(execution.nodes),
        edges: new Set(execution.edges),
    };
    const expectedSetExecution = {
        id: expectedExecution.id,
        startURL: expectedExecution.startURL,
        nodes: new Set(expectedExecution.nodes),
        edges: new Set(expectedExecution.edges),
    };
    expect(setExecution).toStrictEqual(expectedSetExecution);
});

test("create execution without setting periodicity", async () => {
    const model = new Model();
    const websiteRecord = {
        id: "",
        url: "http://youtube.com",
        boundaryRegex: ".*",
        label: "youtube",
        isActive: true,
        tags: ["general"],
        lastExecutionId: null,
    };
    const recordId = await model.createRecord(
        websiteRecord.url,
        websiteRecord.boundaryRegex,
        websiteRecord.label,
        websiteRecord.isActive,
        websiteRecord.tags
    );
    const executionId = await model.createExecutionLink(
        recordId,
        "http://youtube.com",
        "Youtube",
        new Date("2020-01-01")
    );
    await model.createLinkBetweenWebPages(
        "http://youtube.com",
        "http://amazon.com",
        "Amazon",
        new Date("2020-01-01"),
        executionId
    );
    const expectedExecution: ICrawlExecution = {
        id: executionId,
        startURL: "http://youtube.com",
        nodes: [
            {
                url: "http://youtube.com",
                title: "Youtube",
                crawlTime: new Date("2020-01-01"),
            },
            {
                url: "http://amazon.com",
                title: "Amazon",
                crawlTime: new Date("2020-01-01"),
            },
        ],
        edges: [
            {
                sourceURL: "http://youtube.com",
                destinationURL: "http://amazon.com",
            },
        ],
    };
    const execution = await model.getExecution(executionId);
    await model.dispose();
    if (execution === null) throw "Created execution not found;";
    // converting arrays to sets for comparison ignoring order of elements
    const setExecution = {
        id: execution.id,
        startURL: execution.startURL,
        nodes: new Set(execution.nodes),
        edges: new Set(execution.edges),
    };
    const expectedSetExecution = {
        id: expectedExecution.id,
        startURL: expectedExecution.startURL,
        nodes: new Set(expectedExecution.nodes),
        edges: new Set(expectedExecution.edges),
    };
    expect(setExecution).toStrictEqual(expectedSetExecution);
});

test("create execution link with nonexistent website record", async () => {
    const model = new Model();
    await expect(
        model.createExecutionLink(
            "nonexistent",
            "http://google.com",
            "Google",
            new Date("2020-01-01")
        )
    ).rejects.toStrictEqual("websiteRecordId not found");
    await model.dispose();
});

test("create execution and delete it", async () => {
    const model = new Model();
    const websiteRecord = {
        id: "",
        url: "http://youtube.com",
        boundaryRegex: ".*",
        label: "youtube",
        isActive: true,
        tags: ["general"],
        lastExecutionId: null,
    };
    const recordId = await model.createRecord(
        websiteRecord.url,
        websiteRecord.boundaryRegex,
        websiteRecord.label,
        websiteRecord.isActive,
        websiteRecord.tags
    );
    const executionId = await model.createExecutionLink(
        recordId,
        "http://youtube.com",
        "Youtube",
        new Date("2020-01-01")
    );
    await model.createLinkBetweenWebPages(
        "http://youtube.com",
        "http://amazon.com",
        "Amazon",
        new Date("2020-01-01"),
        executionId
    );
    const success = await model.deleteExecution(executionId);
    const execution = await model.getExecution(executionId);
    await model.dispose();
    expect(success).toBe(true);
    expect(execution).toBe(null);
});
// #endregion
