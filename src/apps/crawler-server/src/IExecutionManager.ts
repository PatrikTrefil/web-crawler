export default interface IExecutionManager {
    /**
     * A crawl will be executed as soon as possible and
     *
     * if periodicityInSeconds is 0, the crawl will be executed only once.
     * if periodicityInSeconds is greater than 0, the crawl will be executed periodically and managed until manually stopped.
     *
     * If the record with recordId is already managed, all future (non-enqueued) crawls of based on this record
     * will be cancelled, a new crawl will start as soon as possible and it will be repeated based on periodicityInSeconds (see rules above).
     * @throws "Not found" if a record with recordId is not found.
     */
    startExecutionsOfRecord(recordId: string): Promise<void>;
    /**
     * Stop the management of a record. All ongoing crawls will be finished. All future crawls will be cancelled.
     * If the record is not managed, no action is taken.
     * @throws "Not found" if a record with recordId is not found.
     */
    stopExecutionsOfRecord(recordId: string): Promise<void>;
    /**
     * All future crawls will be cancelled and a new crawl will be started as soon as possible.
     * Call this method after an update of periodicityInSeconds of a record or any other relevant properties to update the management of the record.
     *
     * It is okay to replan even if the execution has not been planned before.
     *
     * @throws "Not found" if a record with recordId is not found.
     */
    replanExecutionsOfRecord(recordId: string): Promise<void>;
}
