import "./RecordList.css";

import { useState, useEffect } from "react";
import { deleteWebsiteRecord } from "./api";
import ReactPaginate from "react-paginate";
import { IWebsiteRecord } from "ts-types";
import { Modal, ModalHeader, ModalBody, List } from "reactstrap";

export function RecordList({
    itemsPerPage,
    records,
    setRecords,
    isLoading,
    error,
    showErrorMessage,
    sortFunction,
}: {
    itemsPerPage: number;
    records: IWebsiteRecord[];
    // eslint-disable-next-line no-unused-vars
    setRecords: (records: IWebsiteRecord[]) => void;
    isLoading: boolean;
    error: string;
    // eslint-disable-next-line no-unused-vars
    showErrorMessage: (message: string) => void;
    sortFunction: // eslint-disable-next-line no-unused-vars
    ((a: IWebsiteRecord, b: IWebsiteRecord) => number) | undefined;
}) {
    const [currentlyDisplayedRecords, setCurrentlyDisplayedRecords] = useState<
        Array<IWebsiteRecord>
    >([]);

    const [pageCount, setPageCount] = useState(0);
    const [itemOffset, setItemOffset] = useState(0);
    const [pageIndex, setPageIndex] = useState(0); // zero based, use this to override current page

    // updating of page count
    useEffect(() => {
        setPageCount(Math.ceil(records.length / itemsPerPage));
    }, [records, itemsPerPage]);
    // recalc indexes if page count changes
    useEffect(() => {
        const lastItemOffset = pageCount > 0 ? pageCount * itemsPerPage - 1 : 0; // set to zero if empty
        if (itemOffset > lastItemOffset) {
            setItemOffset((pageCount - 1) * itemsPerPage);
            setPageIndex(pageCount - 1);
        }
    }, [pageCount]);
    // recompute displayed records if anything changes
    useEffect(() => {
        const endOffset = itemOffset + itemsPerPage;
        const recordsCopy = [...records];
        recordsCopy.sort(sortFunction);
        setCurrentlyDisplayedRecords(recordsCopy.slice(itemOffset, endOffset));
    }, [records, isLoading, itemOffset, itemsPerPage, sortFunction]);

    const handlePageClick = (selectedItem: { selected: number }) => {
        const newOffset =
            (selectedItem.selected * itemsPerPage) % records.length;
        setItemOffset(newOffset);
    };
    return (
        <>
            <Page
                recordsOfPage={currentlyDisplayedRecords}
                records={records}
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
                forcePage={pageIndex}
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
    recordsOfPage: Array<IWebsiteRecord>;
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
        const updatedRecords = props.records.filter(
            (record) => record.id !== recordIdToDelete
        );
        props.setRecords(updatedRecords);
    };

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRecordForDetails, setSelectedRecordForDetails] =
        useState<IWebsiteRecord | null>();
    const toggleDetailModal = () => {
        setIsDetailModalOpen(!isDetailModalOpen);
    };
    const detailsModal = (
        <Modal isOpen={isDetailModalOpen} toggle={toggleDetailModal}>
            <ModalHeader toggle={toggleDetailModal}>Details</ModalHeader>
            <ModalBody>
                {selectedRecordForDetails && (
                    <List type="unstyled">
                        <li>URL: {selectedRecordForDetails.url}</li>
                        <li>Label: {selectedRecordForDetails.label}</li>
                        <li>
                            Boundary regex:{" "}
                            {selectedRecordForDetails.boundaryRegex}
                        </li>
                        <li>Is active?: {selectedRecordForDetails.isActive}</li>
                        <li>
                            Periodicity:{" "}
                            {selectedRecordForDetails.periodicityInSeconds} s
                        </li>
                        <li>
                            Tags: {selectedRecordForDetails.tags.join(", ")}
                        </li>
                    </List>
                )}
                {!selectedRecordForDetails && <div>No record selected</div>}
            </ModalBody>
        </Modal>
    );

    if (props.error)
        return <div className="alert alert-danger">{props.error}</div>;

    if (props.isLoading) return <div className="text-center">Loading ...</div>;

    if (props.recordsOfPage.length > 0) {
        const recordList = props.recordsOfPage.map((record) => {
            return (
                <li className="list-group-item" key={record.id}>
                    <div>
                        {record.label}{" "}
                        <span className="text-secondary">({record.id})</span>
                    </div>
                    <div className="controls">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setSelectedRecordForDetails(record);
                                toggleDetailModal();
                            }}
                        >
                            Details
                        </button>
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
        return (
            <>
                <ul className="record-list list-group">{recordList}</ul>
                {detailsModal}
            </>
        );
    }
    return <div className="text-center">No records exist.</div>;
}
