export interface IWebPage {
    URL: string;
    title?: string;
    crawlTime?: Date;
    links?: URL[];
}

export interface IWebPageLink {
    sourceURL: string;
    destinationURL: string;
}
