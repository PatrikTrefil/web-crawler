import {
    ICrawlExecution,
    IWebsiteRecord,
    IWebsiteRecordTemplate,
    IWebsiteRecordUpdate,
} from "ts-types";

const apiUrl = "http://localhost:8080/api";

// #region website records
/**
 * @returns id of the created record
 * @throws Error if the request fails
 */
export async function createWebsiteRecord(
    recordTemplate: IWebsiteRecordTemplate
): Promise<string> {
    const requestUrl = apiUrl + `/records/create`;
    const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(recordTemplate),
    });
    if (!response.ok) {
        throw new Error(
            `This is an HTTP error: The status is ${response.status}`
        );
    }
    return ((await response.json()) as { recordId: string }).recordId;
}

/**
 *
 * @returns ids of all records
 * @throws Error if the request fails
 */
export async function getRecordIds(): Promise<Array<string>> {
    const response = await fetch(apiUrl + "/records");
    if (!response.ok) {
        throw new Error(
            `This is an HTTP error: The status is ${response.status}`
        );
    }
    return await response.json();
}

/**
 * @returns record with given recordId
 * @throws Error if the request fails
 */
export async function getRecord(recordId: string): Promise<IWebsiteRecord> {
    const response = await fetch(apiUrl + `/records/${recordId}`);
    return (await response.json()) as IWebsiteRecord;
}

/**
 * @returns updated version of the website record
 * @throws Error if the request fails
 */
export async function updateWebsiteRecord(
    recordId: string,
    recordUpdate: IWebsiteRecordUpdate
): Promise<IWebsiteRecord> {
    const response = await fetch(apiUrl + `/records/${recordId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(recordUpdate),
    });
    if (!response.ok)
        throw new Error(
            `This is an HTTP error: The status is ${response.status}`
        );
    return (await response.json()) as IWebsiteRecord;
}

/**
 * @throws Error if the request fails
 */
export async function deleteWebsiteRecord(recordId: string): Promise<void> {
    const response = await fetch(apiUrl + `/records/${recordId}`, {
        method: "DELETE",
    });
    if (!response.ok)
        throw new Error(
            `This is an HTTP error: The status is ${response.status}`
        );
}

// #endregion
// #region crawls

/**
 * @throws Error if the request fails
 */
export async function startCrawl(recordId: string): Promise<void> {
    const response = await fetch(apiUrl + `/records/${recordId}/start`);
    if (!response.ok)
        throw new Error(
            `This is an HTTP error: The status is ${response.status}`
        );
}

export async function getCrawlIds(): Promise<Array<string>> {
    const response = await fetch(apiUrl + `/crawls`);
    if (!response.ok)
        throw new Error(
            `This is an HTTP error: The status is ${response.status}`
        );
    return (await response.json()) as string[];
}

/**
 * @returns execution of the crawl with given executionId
 * @throws Error if the request fails
 */
export async function getCrawl(crawlId: string): Promise<ICrawlExecution> {
    const response = await fetch(apiUrl + `/crawls/${crawlId}`);
    if (!response.ok)
        throw new Error(
            `This is an HTTP error: The status is ${response.status}`
        );
    const almostCrawl = await response.json();
    for (const node of almostCrawl.nodes)
        if (node.crawlTime) node.crawlTime = new Date(node.crawlTime);
    const crawl = almostCrawl;
    return crawl as ICrawlExecution;
}

// #endregion
