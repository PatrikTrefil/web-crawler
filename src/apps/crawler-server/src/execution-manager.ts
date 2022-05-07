import { ICrawlExecution, IWebsiteRecord } from "ts-types";
import { Worker } from "worker_threads"
import {IExecutionManager} from "./interfaces/execution-manager.model"

export class executionManager implements IExecutionManager
{
    executionQueue : Array<ICrawlExecution>
    currentExecutions : Array<ICrawlExecution>

    maxConcurrentExecutions = 1;

    constructor()
    {
        this.executionQueue = new Array<ICrawlExecution>()
        this.currentExecutions = new Array<ICrawlExecution>()
    }

    deleteWebsiteRecord(recordId: number): boolean {
        // TODO: Remove from queue
        return false;
    }

    getQueuedExecutions(): Array<ICrawlExecution> {
        return this.executionQueue;
    }

    getActiveExecutions(): Array<ICrawlExecution> {
        return this.currentExecutions;
    }

    // Start queued executions, if currentExecutions.Length < maxConcurrentExecutions
    addQueuedExecutions()
    {
        // Return if we cannot run another executions
        if (this.currentExecutions.length >= this.maxConcurrentExecutions)
        {
            return;
        }

        // Compute how many items we can add to current executions
        const itemsToAdd = Math.min(this.executionQueue.length, this.maxConcurrentExecutions - this.currentExecutions.length);

        // Add all the executions to execution queue
        for (let i = 0; i < itemsToAdd; i++)
        {
            const execution = this.executionQueue[i];
            this.executionQueue.push(execution);
        }

        // Remove them from enqueued executions
        this.executionQueue.splice(0, itemsToAdd);
    }

    // This will check all executions in currentExecutions and will start them if they are inactive
    startQueuedExecutions()
    {
        // Needs to use crawler and worker threads

        // TODO: Make worker thread for each execution
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

    crawlingFinished(execution : ICrawlExecution)
    {
        // Might not be used, as worker threads will work differently
        throw new Error("Not implemented");
    }
}
