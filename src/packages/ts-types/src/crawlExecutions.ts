import { IWebPage } from "./webPages";

export interface ICrawlExecution {
    id: string;
    startURL: string;
    nodes: IWebPage[];
}
