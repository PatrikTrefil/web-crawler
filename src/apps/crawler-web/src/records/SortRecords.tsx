import React, { useState, useEffect } from "react";
import { SortRecordFunction } from "./RecordsPage";

export default function SortSelect({
    setSortFunction,
    sortFunctions,
}: {
    setSortFunction: React.Dispatch<React.SetStateAction<SortRecordFunction>>;
    sortFunctions: {
        url: SortRecordFunction;
        lastTimeOfCrawl: SortRecordFunction;
    };
}) {
    const [sortByFormFieldValue, setSortByFormFieldValue] = useState<
        "url" | "lastTimeOfCrawl"
    >("url");

    useEffect(() => {
        setSortFunction(() => sortFunctions[sortByFormFieldValue]);
    }, [sortByFormFieldValue]);

    return (
        <form>
            <label className="form-label" htmlFor="sort">
                Sort by:
            </label>
            <select
                value={sortByFormFieldValue}
                onChange={(e) =>
                    setSortByFormFieldValue(
                        e.target.value as "url" | "lastTimeOfCrawl"
                    )
                }
                name="sort"
                id="sort"
                className="form-select mb-3"
            >
                <option value="url">URL</option>
                <option value="lastTimeOfCrawl">Last time of crawl</option>
            </select>
        </form>
    );
}
