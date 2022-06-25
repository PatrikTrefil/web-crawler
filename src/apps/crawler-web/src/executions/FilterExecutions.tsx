import { useEffect, useState } from "react";
import { ICrawlExecution, IWebsiteRecord } from "ts-types";

export default function FilterExecutions({
    records,
    executions,
    setFilteredExecutions,
}: {
    records: IWebsiteRecord[];
    executions: ICrawlExecution[];
    // eslint-disable-next-line no-unused-vars
    setFilteredExecutions: (executions: ICrawlExecution[]) => void;
}) {
    const [recordFilter, setRecordFilter] = useState("");
    useEffect(() => {
        if (recordFilter === "") setFilteredExecutions(executions);
        else {
            const executionsCopy = [...executions];
            // TODO: need to have some connection between executions and records to make this filtering work
            // executionsCopy.filter((execution) => {});
            setFilteredExecutions(executionsCopy);
        }
    }, [recordFilter, executions]);
    return (
        <form>
            <div className="mb-3">
                <label htmlFor="recordFilter">Filter by record:</label>
                <select
                    id="recordFilter"
                    name="recordFilter"
                    onChange={(e) => setRecordFilter(e.target.value)}
                    className="form-select"
                >
                    <option value="">-</option>
                    {records.map((record) => (
                        <option key={record.id} value={record.id}>
                            {record.id}
                        </option>
                    ))}
                </select>
            </div>
        </form>
    );
}
