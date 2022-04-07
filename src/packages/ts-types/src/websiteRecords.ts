import { ICrawlExecution } from "./crawlExecutions";

export interface IWebsiteRecord {
    id: number;
    url: URL;
    boundaryRegex?: RegExp;
    periodicityInSeconds?: number;
    label: string;
    isActive: boolean;
    tags: string[];
    lastExecution: ICrawlExecution;
}
