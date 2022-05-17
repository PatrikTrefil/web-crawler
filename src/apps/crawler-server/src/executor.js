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
            `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@work-queue:5672`,
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
}
console.log("[Thread %s] started", worker_threads.threadId);
const executor = new Executor();
executor.startConsuming();
