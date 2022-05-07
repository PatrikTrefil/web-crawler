import {IWebsiteRecord, ICrawlExecution} from "ts-types";

/*
 * Execution manager takes care of making executions, which will be passed to crawler
 */
export interface IExecutionManager {
    // exampleFunction: (parameter1 : parameter1Type): outputType,

    // Returns true if execution is successfully started
    startExecution(websiteRecord: IWebsiteRecord) : boolean

    // Removes all queued and active executions related to passed website record
    deleteWebsiteRecord(recordId: number): boolean,

    // Method to start function ExecutionManager
    start() : null,

    // Returns array of queued executions
    getQueuedExecutions(): Array<ICrawlExecution>

    getActiveExecutions(): Array<ICrawlExecution>
}

export interface IExecutor {
    execution : ICrawlExecution
}
