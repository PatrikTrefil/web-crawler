import { IWebPage } from "./webPages";

export interface ICrawlExecution {
    id: string;
    sourceRecordId: string;
    startURL: string;
    nodes: IWebPage[];
}
