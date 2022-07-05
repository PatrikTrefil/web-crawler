export default interface IExecutionManager {
    /**
     * All future crawls will be cancelled and a new crawl will be started as soon as possible. The crawl will be repeated based on periodicity and active state.
     * Call this method after an update of periodicityInSeconds of a record or any other relevant properties to update the management of the record.
     *
     * It is okay to call this method even if the executions have already been started earlier.
     *
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
     * If the record with recordId is active, startExecutionsOfRecord is called.
     * If the record is inactive, one crawl will be performed as soon as possible.
     *
     * @throws "Not found" if a record with recordId is not found.
     */
    hardStartOfExecution(recordId: string): Promise<void>;
}
