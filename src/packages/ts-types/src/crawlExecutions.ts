import { IWebPage, IWebPageLink } from "./webPages";

export interface ICrawlExecution {
    id: string;
    startURL: URL;
    nodes: IWebPage[];
    edges: IWebPageLink[];
}
