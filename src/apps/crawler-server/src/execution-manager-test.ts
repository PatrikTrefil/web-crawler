import { executionManager } from "./execution-manager";
import { ICrawlExecution, IWebsiteRecord } from "ts-types";

export function runTest() {
    const ex = new executionManager();

    ex.recordQueue = [
        new class implements IWebsiteRecord
        {
            boundaryRegex = new RegExp('http[s?]://apify.com/[.+]/[.+]');
            id = 0;
            isActive = false;
            label = '';
            lastExecution: ICrawlExecution | null = null;
            periodicityInSeconds = 2000;
            tags: string[] = ['a'];
            url: URL = new URL('https://apify.com/store');

        }
    ]

    ex.start();
}

