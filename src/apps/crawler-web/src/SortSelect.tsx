import React, { useState, useEffect } from "react";
import { IWebsiteRecord } from "ts-types";

export default function SortSelect({
    setSortFunction,
}: {
    setSortFunction: React.Dispatch<
        React.SetStateAction<
            // eslint-disable-next-line no-unused-vars
            ((a: IWebsiteRecord, b: IWebsiteRecord) => number) | undefined
        >
    >;
}) {
    const [sortByFormFieldValue, setSortByFormFieldValue] = useState("url");
    const sortFunctions: {
        // eslint-disable-next-line no-unused-vars
        [key: string]: (a: IWebsiteRecord, b: IWebsiteRecord) => number;
    } = {
        url: (a: IWebsiteRecord, b: IWebsiteRecord) => {
            if (a.url < b.url) return -1;
            else if (a.url > b.url) return 1;
            return 0;
        },
        lastTimeOfCrawl: (a: IWebsiteRecord, b: IWebsiteRecord) => {
            // HACK: sort by last time of crawl
            if (a.url < b.url) return 1;
            else if (a.url > b.url) return -1;
            return 0;
        },
    };

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
                onChange={(e) => setSortByFormFieldValue(e.target.value)}
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
