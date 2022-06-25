import { useEffect, useState } from "react";
import { IWebsiteRecord } from "ts-types";

export function Filter({
    records,
    setFilteredRecords,
}: {
    records: IWebsiteRecord[];
    // eslint-disable-next-line no-unused-vars
    setFilteredRecords: (records: IWebsiteRecord[]) => void;
}) {
    const [labelFilter, setLabelFilter] = useState("");
    const [urlFilter, setUrlFilter] = useState("");
    const [showActive, setShowActive] = useState(true);
    const [showInactive, setShowInactive] = useState(true);
    const [tagsFilter, setTagsFilter] = useState(""); // comma-separated list of tags in a string

    // filtering
    useEffect(() => {
        // eslint-disable-next-line no-unused-vars
        const predicates: ((record: IWebsiteRecord) => boolean)[] = [
            (record) => labelFilter === "" || record.label === labelFilter,
            (record) => urlFilter === "" || record.url === urlFilter,
            (record) => {
                if (tagsFilter === "") return true;
                const tags = tagsFilter.split(",");
                for (const tag of tags)
                    if (!record.tags.includes(tag)) return false;
                return true;
            },
            (record) => {
                if (record.isActive && !showActive) return false;
                if (!record.isActive && !showInactive) return false;
                return true;
            },
        ];
        setFilteredRecords(
            records.filter((record) => {
                for (const predicate of predicates)
                    if (!predicate(record)) return false;
                return true;
            })
        );
    }, [labelFilter, urlFilter, showActive, showInactive, tagsFilter, records]);

    return (
        <form className="p-3 border mb-3">
            <h3>Filters</h3>
            <div className="mb-3">
                <label htmlFor="labelFilter" className="form-label">
                    Label
                </label>
                <input
                    type="text"
                    name="labelFilter"
                    id="labelFilter"
                    value={labelFilter}
                    onChange={(e) => setLabelFilter(e.target.value)}
                    className="form-control"
                />
            </div>
            <div className="mb-3">
                <label htmlFor="urlFilter" className="form-label">
                    URL
                </label>
                <input
                    type="text"
                    name="urlFitler"
                    id="urlFilter"
                    value={urlFilter}
                    onChange={(e) => setUrlFilter(e.target.value)}
                    className="form-control"
                />
            </div>
            <div className="mb-3">
                <div className="form-check">
                    <input
                        type="checkbox"
                        name="showActive"
                        id="showActive"
                        checked={showActive}
                        onChange={(e) => setShowActive(e.target.checked)}
                        className="form-check-input"
                    />
                    <label htmlFor="showActive" className="form-check-label">
                        Show active
                    </label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        name="showInactive"
                        id="showInactive"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="form-check-input"
                    />
                    <label htmlFor="showInactive" className="form-check-label">
                        Show inactive
                    </label>
                </div>
            </div>
            <div className="mb-3">
                <label htmlFor="tagsFilter" className="form-label">
                    Tags (comma-separated list)
                </label>
                <input
                    type="text"
                    id="tagsFilter"
                    name="tagsFilter"
                    value={tagsFilter}
                    onChange={(e) => setTagsFilter(e.target.value)}
                    className="form-control"
                />
            </div>
        </form>
    );
}
