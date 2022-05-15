import { IWebPage, IWebPageLink } from "./webPages";

export interface ICrawlExecution {
    id: string;
    startURL: string;
    nodes: IWebPage[];
    edges: IWebPageLink[];
}
