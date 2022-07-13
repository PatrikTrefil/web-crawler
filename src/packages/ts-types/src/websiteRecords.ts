import { ICrawlExecution } from "./crawlExecutions";

export interface IWebsiteRecord {
    id: string;
    url: string;
    boundaryRegex: string;
    periodicityInSeconds: number; // 0 means no automatic repetition
    label: string;
    isActive: boolean;
    tags: string[];
    lastExecutionId: string | null;
}

export interface IWebsiteRecordUpdate {
    url?: string;
    boundaryRegex?: string;
    periodicityInSeconds?: number;
    label?: string;
    isActive?: boolean;
    tags?: string[];
}

export interface IWebsiteRecordTemplate {
    url: string;
    boundaryRegex: string;
    periodicityInSeconds: number;
    label: string;
    isActive: boolean;
    tags: string[];
}
