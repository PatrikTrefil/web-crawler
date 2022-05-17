export interface IWebPage {
    url: string;
    title?: string;
    crawlTime?: Date;
    links?: string[];
}

export interface IWebPageLink {
    sourceURL: string;
    destinationURL: string;
}
