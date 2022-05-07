import {IExecutor} from "./interfaces/execution-manager.model"
import { ICrawlExecution, IWebsiteRecord } from "ts-types";
import Apify from "apify";

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

export class executor implements IExecutor
{
    execution: ICrawlExecution
    record: IWebsiteRecord

    constructor(execution : ICrawlExecution, record: IWebsiteRecord)
    {
       this.execution = execution;
       this.record = record;
    }

    setCurrentDateToExecution()
    {
        this.execution.crawlTime.start = new Date();
    }

    async startCrawling()
    {
        log.debug("Crawler started")
        this.setCurrentDateToExecution()

        // Create a RequestQueue
        const requestQueue = await Apify.openRequestQueue();
        // Define the starting URL
        await requestQueue.addRequest({ url: this.execution.url.toString() });

        // TODO: In handle page Function save the information to crawlExecution
        const handlePageFunction = async ({ request, $ }) => {
            console.log(request.url);
            // Add some links from page to RequestQueue
            const sites = await Apify.utils.enqueueLinks({
                $,
                requestQueue,
                baseUrl: request.loadedUrl,
                pseudoUrls: [this.record.boundaryRegex],
            });
        };

        const handleFailedRequestFunction = async ({ request }) => {
            log.debug(`Request ${request.url} failed twice.`);
        }

        const crawler = new Apify.CheerioCrawler({
            requestQueue,
            handlePageFunction
        });

        await crawler.run();
    }
}
