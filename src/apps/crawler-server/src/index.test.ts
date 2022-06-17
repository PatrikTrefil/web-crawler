import axios from "axios";

const hostname = "localhost";
const port = 8080;

test.each([
    {
        boundaryRegex: ".*",
        label: "Google",
        isActive: true,
        tags: ["tag1", "tag2"],
        periodicityInSeconds: 0,
    },
    {
        url: "http://www.google.com",
        label: "Google",
        isActive: true,
        tags: ["tag1", "tag2"],
        periodicityInSeconds: 0,
    },
    {
        url: "http://www.google.com",
        boundaryRegex: ".*",
        isActive: true,
        tags: ["tag1", "tag2"],
        periodicityInSeconds: 0,
    },
    {
        url: "http://www.google.com",
        boundaryRegex: ".*",
        label: "Google",
        tags: ["tag1", "tag2"],
        periodicityInSeconds: 0,
    },
    {
        url: "http://www.google.com",
        boundaryRegex: ".*",
        label: "Google",
        isActive: true,
        periodicityInSeconds: 0,
    },
    {
        url: "http://www.google.com",
        boundaryRegex: 4,
        label: "Google",
        isActive: true,
        tags: ["tag1", "tag2"],
        periodicityInSeconds: 0,
    },
    {
        url: "google",
        boundaryRegex: ".*",
        label: "Google",
        isActive: true,
        tags: ["tag1", "tag2"],
        periodicityInSeconds: 0,
    },
    {
        url: "http://www.google.com",
        boundaryRegex: ".*",
        label: "Google",
        isActive: true,
        tags: [1, "tag2"],
        periodicityInSeconds: 0,
    },
    {
        url: "http://www.google.com",
        boundaryRegex: ".*",
        label: "",
        isActive: true,
        tags: ["tag1"],
        periodicityInSeconds: 0,
    },
])("create invalid record", async (record) => {
    await expect(() =>
        axios.post(`http://${hostname}:${port}/api/records/create`, record)
    ).rejects.toThrowError("Request failed with status code 400");
});

test.each([
    {
        url: "http://www.google.com",
        boundaryRegex: ".*",
        label: "Google",
        isActive: true,
        tags: ["tag1", "tag2"],
        periodicityInSeconds: 0,
    },
])("create valid record", async (record) => {
    const response = await axios.post(
        `http://${hostname}:${port}/api/records/create`,
        record
    );
    expect(response.status).toBe(201);
    expect(response.data.recordId).toBeTruthy();

    const getRecordResponse = await axios.get(
        `http://${hostname}:${port}/api/records/` + response.data.recordId
    );
    expect(getRecordResponse.data).toStrictEqual({
        ...record,
        lastExecutionId: null,
        id: response.data.recordId,
    });
});
