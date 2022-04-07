export interface ICrawlExecution {
    url: URL;
    crawlTime: {
        start: Date;
        end: Date;
    };
    crawlTimeLengthInSeconds(): number;
    title: string;
    links: [URL];
    status: boolean;
}
