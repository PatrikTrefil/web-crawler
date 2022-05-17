import { ICrawlExecution } from "./crawlExecutions";

export interface IWebsiteRecord {
    id: string;
    url: string;
    boundaryRegex: string;
    periodicityInSeconds?: number;
    label: string;
    isActive: boolean;
    tags: string[];
    lastExecutionId: string;
}

export interface IWebsiteRecordUpdate {
    url?: string;
    boundaryRegex?: string;
    periodicityInSeconds?: number;
    label?: string;
    isActive?: boolean;
    tags?: string[];
}
