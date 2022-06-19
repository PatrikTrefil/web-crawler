import "./RecordList.css";

import { useState, useEffect } from "react";
import { deleteWebsiteRecord } from "./api";
import ReactPaginate from "react-paginate";
import { IWebsiteRecord } from "ts-types";

export function RecordList({
    itemsPerPage,
    records,
    setRecords,
    isLoading,
    error,
    showErrorMessage,
}: {
    itemsPerPage: number;
    records: IWebsiteRecord[];
    // eslint-disable-next-line no-unused-vars
    setRecords: (records: IWebsiteRecord[]) => void;
    isLoading: boolean;
    error: string;
    // eslint-disable-next-line no-unused-vars
    showErrorMessage: (message: string) => void;
}) {
    const [currentlyDisplayedRecords, setCurrentlyDisplayedRecords] = useState<
        Array<IWebsiteRecord>
    >([]);

    const [pageCount, setPageCount] = useState(0);
    const [itemOffset, setItemOffset] = useState(0);

    useEffect(() => {
        const endOffset = itemOffset + itemsPerPage;
        setCurrentlyDisplayedRecords(records.slice(itemOffset, endOffset));
        setPageCount(Math.ceil(records.length / itemsPerPage));
    }, [records, isLoading, itemOffset, itemsPerPage]);

    const handlePageClick = (selectedItem: { selected: number }) => {
        const newOffset =
            (selectedItem.selected * itemsPerPage) % records.length;
        setItemOffset(newOffset);
    };
    return (
        <>
            <Page
                records={currentlyDisplayedRecords}
                setRecords={setRecords}
                error={error}
                isLoading={isLoading}
                showErrorMessage={showErrorMessage}
            />
            <ReactPaginate
                breakLabel="..."
                nextLabel="Next"
                onPageChange={handlePageClick}
                pageRangeDisplayed={5}
                pageCount={pageCount}
                activeClassName="active"
                disabledClassName="disabled"
                className="pagination justify-content-center mt-3"
                pageClassName="page-item"
                previousClassName="page-item"
                nextClassName="page-item"
                pageLinkClassName="page-link"
                previousLinkClassName="page-link"
                nextLinkClassName="page-link"
            />
        </>
    );
}

export function Page(props: {
    records: Array<IWebsiteRecord>;
    // eslint-disable-next-line no-unused-vars
    setRecords: (records: Array<IWebsiteRecord>) => void;
    error: string;
    isLoading: boolean;
    // eslint-disable-next-line no-unused-vars
    showErrorMessage: (message: string) => void;
}) {
    const handleDelete = async (recordIdToDelete: string) => {
        try {
            await deleteWebsiteRecord(recordIdToDelete);
        } catch (e) {
            if (e instanceof Error) props.showErrorMessage(e.message);
            else props.showErrorMessage("Unknown error");
            return;
        }
        props.setRecords(
            props.records.filter((record) => record.id !== recordIdToDelete)
        );
    };

    if (props.error)
        return <div className="alert alert-danger">{props.error}</div>;

    if (props.isLoading) return <div className="text-center">Loading ...</div>;

    if (props.records.length > 0) {
        const recordList = props.records.map((record) => {
            return (
                <li className="list-group-item" key={record.id}>
                    <div>
                        {record.label}{" "}
                        <span className="text-secondary">({record.id})</span>
                    </div>
                    <div className="controls">
                        <button className="btn btn-primary">Details</button>
                        <button
                            className="btn btn-danger"
                            onClick={async () => {
                                await handleDelete(record.id);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </li>
            );
        });
        return <ul className="record-list list-group">{recordList}</ul>;
    }
    return <div className="text-center">No records exist.</div>;
}
