import { ICrawlExecution, IWebsiteRecord } from "ts-types";
import { Worker } from "worker_threads"
import {IExecutionManager} from "./interfaces/execution-manager.model"

export class executionManager implements IExecutionManager
{
    recordQueue : Array<IWebsiteRecord>
    activeRecordExecutions : Array<ExecutionRecord>

    workers: Array<Worker>

    maxConcurrentExecutions = 1;

    constructor()
    {
        this.recordQueue = new Array<IWebsiteRecord>()
        this.activeRecordExecutions = new Array<ExecutionRecord>()

        this.workers = new Array<Worker>()

        // Let's initialize array of workers, which will be used to start crawling for each execution
        for (let i = 0; i < this.maxConcurrentExecutions; i++)
        {
            this.workers.push(new Worker('./crawler.ts'));

            // When they stop, they will send a message to crawlingFinished
            this.workers[i].on(
                'message',
                data => this.crawlingFinished(data.execution, data.record, data.timeFinished)
            );
        }
    }

    deleteWebsiteRecord(recordId: number): boolean {
        // TODO: Remove from queue, stop worker thread
        return false;
    }

    getQueuedRecords(): Array<IWebsiteRecord> {
        return this.recordQueue;
    }

    getActiveExecutions(): Array<ICrawlExecution> {
        //TODO: Return executions or records?
        throw new Error('Not implemented');
    }

    // Add queued executions, if currentExecutions.Length < maxConcurrentExecutions
    addQueuedExecutions()
    {
        // Return if we cannot run another executions
        if (this.activeRecordExecutions.length >= this.maxConcurrentExecutions)
        {
            return;
        }

        // Compute how many items we can add to current executions
        const itemsToAdd = Math.min(this.recordQueue.length, this.maxConcurrentExecutions - this.activeRecordExecutions.length);

        // Add all the executions to execution queue
        for (let i = 0; i < itemsToAdd; i++)
        {
            const record = this.recordQueue[i];

            // TODO: Implementation of ICrawlExecution
            const execution = new class implements ICrawlExecution {
                crawlTime: { start: Date; end: Date };
                links: [URL];
                status: boolean = false;
                title: string;
                url: URL;
                crawlTimeLengthInSeconds(): number {
                    return 0;
                }
            }

            this.activeRecordExecutions.push(new ExecutionRecord(execution , record));
        }

        // Remove them from enqueued executions
        this.recordQueue.splice(0, itemsToAdd);
    }

    // This will check all executions in currentExecutions and will start them if they are inactive
    startQueuedExecutions()
    {
        for (let i = 0; i < this.activeRecordExecutions.length; i++)
        {
            const ex = this.activeRecordExecutions[i];

            // If execution is active, we can continue
            if (ex.execution.status)
                continue;

            ex.execution.status = true;

            // Send message to worker so that he starts working
            this.workers[i].postMessage({execution: ex.execution, record: ex.record});
        }
    }

    start() {

        // Load all website records from storage

        // Enqueue them

        // Loop through them every minute to check if they need to be run
        // if so, enqueue them
        this.addQueuedExecutions()
        this.startQueuedExecutions()

        // Run function every minute: https://stackoverflow.com/a/13304481
    }

    crawlingFinished(execution : ICrawlExecution, record: IWebsiteRecord, timeFinished: Date)
    {
        // TODO: Move execution from active to queue
        // TODO: Pass data to database
        console.error("not implemented... but crawlingFinished was called!");
    }
}

// Wrapper of crawlExecutions and websiteRecords
class ExecutionRecord {
    execution: ICrawlExecution
    record: IWebsiteRecord

    constructor(execution: ICrawlExecution, record: IWebsiteRecord)
    {
        this.execution = execution;
        this.record = record;
    }
}
