import {
    ICrawlExecution,
    IWebsiteRecord,
    IWebsiteRecordUpdate,
} from "ts-types";

export default interface IModel {
    // #region WebsiteRecords
    /**
     * Get an array of all record ids
     */
    getRecordIds(): Promise<string[]>;

    /**
     * @param id The id of the record to get
     * @returns The record with the given id or null if the record does not exist
     */

    getRecordById(id: string): Promise<IWebsiteRecord | null>;

    /**
     * Creates a website record and returns the auto-generated id of the created record.
     */
    createRecord(
        url: URL,
        boundaryRegex: RegExp,
        label: string,
        isActive: boolean,
        tags: string[],
        periodicityInSeconds?: number
    ): Promise<string>;

    /**
     * Update field of record with given id
     * @param id The id of the record to update
     * @returns The updated record or null if the record does not exist
     */
    updateRecord(
        id: string,
        // using an object instead of arguments to utilize optional fields
        recordUpdate: IWebsiteRecordUpdate
    ): Promise<IWebsiteRecord | null>;

    /**
     * Deletes the record with the given id.
     * @param id The id of the record to delete
     * @throws 'Failed' if the operation failed
     * @returns bool indicating success/not found
     */
    deleteRecord(id: string): Promise<boolean>;

    /**
     * @returns auto-generated id of the execution
     */
    // #endregion

    // #region CrawlExecutions

    /**
     * Create a link between a website record (template for an execution)
     * and the starting webpage of the crawl if it does not exist.
     * @param websiteRecordId id of the website record from which the link is coming
     * @param webPageURL URL of the webpage to which the link is going
     * @param title title of the target web page
     * @param crawlTime time of crawl execution on the web page
     * @returns auto-generated id of the execution
     * @throws "websiteRecordId not found" if a web page with websiteRecordId does not exist
     * @throws "webPageId not found" if a web page with webPageId does not exist
     * @throws "Item with websiteRecordId is not of type WebsiteRecord" if the type of the item with websiteRecordId doesn't have the type WebsiteRecord
     * @throws "Item with webPageURL is not of type WebPage" if the type of the item with webPageURL doesn't have the type WebPage
     */
    createExecutionLink(
        websiteRecordId: string,
        webPageURL: URL,
        title: string,
        crawlTime: Date
    ): Promise<string>;

    /**
     * link two webpages together (directed relationship) if the link does not exist
     * @param fromWebPageURL id of the webpage (crawled or uncrawled) from which the link is coming
     * @param toWebPageURL id of the webpage to which the link is going
     * @param title title of the target web page
     * @param crawlTime time of crawl execution on the web page
     * @param crawlExecutionId id of the crawl execution
     * @throws "Webpage with fromWebPageURL not found"
     * @throws "Webpage with toWebPageURL not found"
     */
    createLinkBetweenWebPages(
        fromWebPageURL: URL,
        toWebPageURL: URL,
        title: string,
        crawlTime: Date,
        crawlExecutionId: string
    ): Promise<string>;

    /**
     * @returns true if the execution was successfully deleted, false if the execution does not exist
     */
    deleteExecution(executionId: string): Promise<boolean>;

    /**
     * @returns ICrawlExecution or null if ICrawlExecution with the given id was not found
     */
    getExecution(crawlExecutionId: string): Promise<ICrawlExecution | null>;
    // #endregion
}
