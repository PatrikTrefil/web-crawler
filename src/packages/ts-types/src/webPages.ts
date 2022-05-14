export interface IWebPage {
    URL: URL;
    title?: string;
    crawlTime?: Date;
    links?: URL[];
}

export interface IWebPageLink {
    sourceId: string;
    destinationId: string;
}
