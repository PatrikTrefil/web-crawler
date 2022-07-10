import { useEffect, useState } from "react";
import { ICrawlExecution, IWebsiteRecord } from "ts-types";
import { getCrawlIds, getCrawl, getRecord, getRecordIds } from "../api";
import ExecutionsList from "./ExecutionsList";
import FilterExecutions from "./FilterExecutions";

export default function ExecutionsPage() {
    const [executions, setExecutions] = useState<Array<ICrawlExecution>>([]);
    const [filteredExecutions, setFilteredExecutions] = useState<
        Array<ICrawlExecution>
    >([]);
    const [isLoadingExecutions, setIsLoadingExecutions] = useState(true);

    const [errorMsgExecutionsLoading, setErrorMsgRecordLoading] = useState(""); // empty string => no errors

    const [records, setRecords] = useState<Array<IWebsiteRecord>>([]);
    // load executions from the server
    useEffect(() => {
        const getData = async () => {
            try {
                const executionIds = await getCrawlIds();
                const promises = [];
                for (const executionId of executionIds)
                    promises.push(getCrawl(executionId));
                const executions = await Promise.all(promises);
                setExecutions(executions);
            } catch {
                setErrorMsgRecordLoading("Error loading executions.");
            } finally {
                setIsLoadingExecutions(false);
            }
        };
        getData();
    }, []);
    // load records from the server
    useEffect(() => {
        const getData = async () => {
            try {
                const recordIds = await getRecordIds();
                const promises = [];
                for (const recordId of recordIds)
                    promises.push(getRecord(recordId));
                const records = await Promise.all(promises);
                setRecords(records);
            } catch {
                console.log("records could not load");
            }
        };
        getData();
    }, []);
    return (
        <main>
            <h1>Executions</h1>
            <FilterExecutions
                records={records}
                executions={executions}
                setFilteredExecutions={setFilteredExecutions}
            />
            <ExecutionsList
                executions={filteredExecutions}
                isLoadingExecutions={isLoadingExecutions}
                errorMsgExecutionsLoading={errorMsgExecutionsLoading}
                itemsPerPage={5}
            />
        </main>
    );
}
