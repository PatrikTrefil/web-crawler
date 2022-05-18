/* eslint-disable @typescript-eslint/no-non-null-assertion */
import IExecutionManager from "./IExecutionManager";
import "dotenv/config";
import amqp from "amqplib/callback_api";
import { Worker } from "worker_threads";
import IModel from "./IModel";
import Model from "./model";
import { ToadScheduler, SimpleIntervalJob, Task } from "toad-scheduler";
import { IWebsiteRecord } from "ts-types";

type LinkData = {
    fromWebPageURL: string,
    toWebPageURL: string,
    title: string,
    crawlTime: Date
}
type ExecutionData = {
    recordId: string,
    url: string,
    links: LinkData[]
}

export default class ExecutionManager implements IExecutionManager {
    private workers: Worker[];
    private model: IModel;
    private scheduler: ToadScheduler;
    constructor(workerCount: number, model: IModel) {
        this.scheduler = new ToadScheduler();
        this.model = model;
        this.workers = new Array<Worker>(workerCount);
        for (let i = 0; i < workerCount; i++) {
            this.workers[i] = new Worker("./src/executor.js");
            this.workers[i].on("exit", (code) => {
                if (code !== 0) throw "Worker exited with code " + code;
            });
            this.workers[i].on("message", async (data: ExecutionData) => {
                console.log("Data received in execution manager");
                console.log(data);
                const record = await this.model.getRecordById(data.recordId);
                if (record !== null) {
                    if (record?.lastExecutionId !== null)
                        this.model.deleteExecution(record.lastExecutionId);
                    const recordWebPageLink = data.links.find(
                        (link) => link.fromWebPageURL === null
                    );
                    const executionId = await this.model.createExecutionLink(
                        data.recordId,
                        recordWebPageLink!.toWebPageURL,
                        recordWebPageLink!.title,
                        recordWebPageLink!.crawlTime
                    );
                    for (const link of data.links) {
                        if (link.fromWebPageURL !== null)
                            await this.model.createLinkBetweenWebPages(
                                link.fromWebPageURL,
                                link.toWebPageURL,
                                link.title,
                                link.crawlTime,
                                executionId
                            );
                    }
                }
            });
        }
    }
    enqueueCrawl(record: IWebsiteRecord) {
        // send to work queue
        amqp.connect(
            `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@work-queue:5672`,
            (error0, connection) => {
                if (error0) throw error0;
                connection.createChannel(async (error1, channel) => {
                    if (error1) throw error1;

                    const queue = "crawls";
                    const msg = JSON.stringify(record);

                    channel.assertQueue(queue, {
                        durable: true,
                    });
                    channel.sendToQueue(queue, Buffer.from(msg), {
                        persistent: true,
                    });

                    console.log(" [x] Sent %s", msg);
                });
                setTimeout(function () {
                    connection.close();
                }, 500);
            }
        );
    }
    async startExecutionsOfRecord(recordId: string): Promise<void> {
        const record = await this.model.getRecordById(recordId);
        if (!record) throw "Not found";

        this.enqueueCrawl(record);
        this.planExecutionOfRecord(record);
    }
    async stopExecutionsOfRecord(recordId: string): Promise<void> {
        this.scheduler.removeById(recordId);
    }
    async replanExecutionsOfRecord(recordId: string): Promise<void> {
        this.scheduler.removeById(recordId);
        const record = await this.model.getRecordById(recordId);
        if (record !== null) this.planExecutionOfRecord(record);
    }
    private planExecutionOfRecord(record: IWebsiteRecord) {
        if (record.periodicityInSeconds === 0) return;

        const crawlTask = new Task("enqueue crawl for recordId", () =>
            this.enqueueCrawl(record)
        );
        const job = new SimpleIntervalJob(
            {
                seconds: record.periodicityInSeconds,
            },
            crawlTask,
            record.id
        );
        this.scheduler.addSimpleIntervalJob(job);
    }
    async startExecutionsForAllActiveRecords() {
        const recordIds = await this.model.getRecordIds();
        for (const recordId of recordIds) {
            const record = await this.model.getRecordById(recordId);
            if (record !== null && record.isActive)
                this.planExecutionOfRecord(record);
        }
    }
}
