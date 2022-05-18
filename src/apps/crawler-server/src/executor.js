// Have to write this in plain JS, because new Worker("file.js") requires pure js
// It is possible to compile before every run, but that's too annoying :'(

/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();
const amqp = require("amqplib/callback_api");
const Apify = require("apify");
const worker_threads = require("worker_threads");

if (process.env.NODE_ENV === "production") {
    // disable logging
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const emptyFunc = () => {};
    console.log = emptyFunc;
    console.info = emptyFunc;
    console.debug = emptyFunc;
}

class Executor {
    queueCounter = 0;
    /**
     * Will subscribe to crawls queue and accept requests indefinitely
     */
    startConsuming() {
        amqp.connect(
            `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@${process.env.RABBITMQ_HOSTNAME}:${process.env.RABBITMQ_PORT}`,
            (error0, connection) => {
                if (error0) throw error0;
                connection.createChannel((error1, channel) => {
                    if (error1) throw error1;

                    const queueName = "crawls";

                    channel.assertQueue(queueName, {
                        durable: true,
                    });
                    channel.prefetch(1); // do not give me more than one task at a time
                    console.log(
                        "[Thread %s] Waiting for messages in %s. To exit press CTRL+C",
                        worker_threads.threadId,
                        queueName
                    );
                    channel.consume(
                        queueName,
                        async (msg) => {
                            const stringRecord = msg.content.toString();
                            console.log(
                                "[Thread %s] Received %s",
                                worker_threads.threadId,
                                stringRecord
                            );
                            const record = JSON.parse(msg.content.toString());
                            const crawlExecution = await this.crawl(record);
                            worker_threads.parentPort.postMessage(
                                crawlExecution
                            );
                            // if the record is not active, just consume the message
                            channel.ack(msg);
                        },
                        {
                            noAck: false,
                        }
                    );
                });
            }
        );
    }
    async crawl(record) {
        const crawlExecution = {
            recordId: record.id,
            url: record.url,
            links: [],
        };
        const requestQueue = await Apify.openRequestQueue(
            // every thread needs its own queue
            // we add queueCounter to the name, because we otherwise get an error: "Database connection is not open" (might be intentional or a bug)
            worker_threads.threadId.toString() + this.queueCounter++
        );
        await requestQueue.addRequest({ url: record.url });

        const handlePageFunction = async ({ request, $ }) => {
            // Extract desired data from site
            const title = $("title").text();
            console.log(`The title of "${request.url}" is: ${title}.`);

            // Enqueue links
            const absoluteAndRelativeUrls = $("a[href]")
                .map((i, el) => $(el).attr("href"))
                .get();
            const absoluteUrls = absoluteAndRelativeUrls.map((link) =>
                new URL(link, request.loadedUrl).toString()
            );
            const link = {
                fromWebPageURL: request.userData.fromWebPageURL ?? null, // null will be assigned only for start page
                toWebPageURL: request.url,
                title: title,
                crawlTime: new Date(),
            };
            crawlExecution.links.push(link);
            const boundaryRegex = new RegExp(record.boundaryRegex);
            for (const url of absoluteUrls)
                if (boundaryRegex.test(url)) {
                    console.log("Enque: " + url);
                    await requestQueue.addRequest({
                        url: url,
                        userData: { fromWebPageURL: request.url },
                    });
                } else {
                    // make note of link going out of bounds (without crawled data)
                    crawlExecution.links.push({
                        fromWebPageURL: request.url,
                        toWebPageURL: url,
                        crawlTime: new Date(),
                    });
                }
        };

        const crawler = new Apify.CheerioCrawler({
            maxRequestsPerCrawl: 20,
            requestQueue,
            handlePageFunction,
        });

        await crawler.run();
        requestQueue.drop();
        return crawlExecution;
    }
}
console.log("[Thread %s] started", worker_threads.threadId);
const executor = new Executor();
executor.startConsuming();
