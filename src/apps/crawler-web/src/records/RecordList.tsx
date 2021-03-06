import "./RecordList.css";

import { useState, useEffect } from "react";
import { deleteWebsiteRecord, getCrawl, startCrawl } from "../api";
import ReactPaginate from "react-paginate";
import { ICrawlExecution, IWebsiteRecord } from "ts-types";
import { Modal, ModalHeader, ModalBody, Tooltip } from "reactstrap";
import EditRecord from "./EditRecord";
import RecordDetails from "./RecordDetails";
import { Link } from "react-router-dom";
import { SortRecordFunction } from "./RecordsPage";

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
    sortFunction: SortRecordFunction;
}) {
    const [currentlyDisplayedRecordIds, setCurrentlyDisplayedRecordIds] =
        useState<string[]>([]);

    const [pageCount, setPageCount] = useState(0);
    const [itemOffset, setItemOffset] = useState(0);
    const [pageIndex, setPageIndex] = useState(-1); // zero based, use this to override current page; -1 means there are no pages

    // updating of page count
    useEffect(() => {
        setPageCount(Math.ceil(records.length / itemsPerPage));
    }, [records, itemsPerPage]);
    // recalc indexes if page count changes
    useEffect(() => {
        if (pageCount === 0) {
            setItemOffset(0);
            setPageIndex(-1);
        } else {
            const lastItemOffset = pageCount * itemsPerPage - 1;
            if (itemOffset > lastItemOffset) {
                setItemOffset((pageCount - 1) * itemsPerPage);
                setPageIndex(pageCount - 1);
            }
        }
    }, [pageCount]);
    // recompute displayed records if anything changes
    useEffect(() => {
        const resort = async () => {
            const endOffset = itemOffset + itemsPerPage;
            const recordsCopy = [...records];
            const lastExecutionPromises: Promise<ICrawlExecution | null>[] =
                recordsCopy
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    .map((record) => {
                        if (record.lastExecutionId !== null)
                            return getCrawl(record.lastExecutionId);
                        else
                            return new Promise((resolve) => {
                                resolve(null);
                            });
                    });

            const lastExecutions = await Promise.all(lastExecutionPromises);
            const recordsWithLastExecution = recordsCopy.map((record, i) => {
                return { ...record, lastExecution: lastExecutions[i] };
            });
            recordsWithLastExecution.sort(sortFunction);
            setCurrentlyDisplayedRecordIds(
                recordsWithLastExecution
                    .slice(itemOffset, endOffset)
                    .map((record) => record.id)
            );
        };
        resort();
    }, [records, isLoading, itemOffset, itemsPerPage, sortFunction]);

    const handlePageClick = (selectedItem: { selected: number }) => {
        const newOffset =
            (selectedItem.selected * itemsPerPage) % records.length;
        setItemOffset(newOffset);
    };
    return (
        <>
            <Page
                recordsOfPage={
                    currentlyDisplayedRecordIds
                        .map((recordId) =>
                            records.find((record) => record.id === recordId)
                        )
                        .filter(
                            (recordOrUndefined) =>
                                recordOrUndefined !== undefined
                        ) as IWebsiteRecord[]
                }
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
    const [idOfSelectedRecordForDetails, setIdOfSelectedRecordForDetails] =
        useState<string>();
    const [isDetailsModalInEditMode, setIsDetailsModalInEditMode] =
        useState(false);
    const toggleEditMode = () => {
        setIsDetailsModalInEditMode(!isDetailsModalInEditMode);
    };
    const toggleDetailModal = () => {
        setIsDetailModalOpen(!isDetailModalOpen);
    };
    const detailsModal = (
        <Modal
            isOpen={isDetailModalOpen}
            toggle={() => {
                setIsDetailsModalInEditMode(false);
                toggleDetailModal();
            }}
        >
            <ModalHeader
                toggle={() => {
                    setIsDetailsModalInEditMode(false);
                    toggleDetailModal();
                }}
            >
                Details
            </ModalHeader>
            <ModalBody>
                {idOfSelectedRecordForDetails && !isDetailsModalInEditMode && (
                    <>
                        <button
                            className="btn btn-info"
                            onClick={toggleEditMode}
                        >
                            Edit
                        </button>
                        <RecordDetails
                            recordToDisplay={props.records.find(
                                (record) =>
                                    record.id === idOfSelectedRecordForDetails
                            )}
                        />
                    </>
                )}
                {idOfSelectedRecordForDetails && isDetailsModalInEditMode && (
                    <EditRecord
                        idOfRecordToEdit={idOfSelectedRecordForDetails}
                        records={props.records}
                        setRecords={props.setRecords}
                        afterSubmit={toggleEditMode}
                    />
                )}
                {!idOfSelectedRecordForDetails && <div>No record selected</div>}
            </ModalBody>
        </Modal>
    );

    const [activeSelection, setActiveSelection] = useState<string[]>([]);

    if (props.error)
        return <div className="alert alert-danger">{props.error}</div>;

    if (props.isLoading) return <div className="text-center">Loading ...</div>;

    if (props.recordsOfPage.length > 0) {
        const recordList = props.recordsOfPage.map((record) => {
            return (
                <li className="list-group-item" key={record.id}>
                    <div>
                        <span>
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        const newSelection = [
                                            ...activeSelection,
                                            record.id,
                                        ];
                                        setActiveSelection(newSelection);
                                    } else
                                        setActiveSelection(
                                            activeSelection.filter(
                                                (id) => id !== record.id
                                            )
                                        );
                                }}
                                checked={activeSelection.includes(record.id)}
                            />
                        </span>
                        <span>
                            {" "}
                            {record.label}{" "}
                            <span className="text-secondary">
                                ({record.id})
                            </span>
                        </span>
                    </div>
                    <div className="controls">
                        <VisualizeButton record={record} />
                        <button
                            className="btn btn-success"
                            onClick={(e) => {
                                e.preventDefault();
                                startCrawl(record.id);
                            }}
                        >
                            Start crawl
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={(e) => {
                                e.preventDefault();
                                setIdOfSelectedRecordForDetails(record.id);
                                toggleDetailModal();
                            }}
                        >
                            Details
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={async (e) => {
                                e.preventDefault();
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
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        window.location.href = `/visualization/website/${activeSelection.join(
                            ","
                        )}`;
                    }}
                >
                    <ul className="record-list list-group">{recordList}</ul>
                    <button
                        className="btn btn-primary position-fixed bottom-0 start-0 m-3"
                        type="submit"
                    >
                        Visualize selected items
                    </button>
                </form>
                {detailsModal}
            </>
        );
    }
    return <div className="text-center">No records exist.</div>;
}

function VisualizeButton({ record }: { record: IWebsiteRecord }) {
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const toggleTooltip = () => {
        setIsTooltipOpen(!isTooltipOpen);
    };
    return (
        <>
            <span className="d-inline-block" id={`visualize-link-${record.id}`}>
                <Link
                    to={
                        record.lastExecutionId
                            ? `/visualization/website/${record.id}`
                            : ""
                    }
                    className={`btn btn-dark${
                        record.lastExecutionId ? "" : " disabled"
                    }`}
                >
                    Visualize last crawl
                </Link>
            </span>
            {!record.lastExecutionId && (
                <Tooltip
                    isOpen={isTooltipOpen}
                    toggle={toggleTooltip}
                    target={`visualize-link-${record.id}`}
                >
                    This record does not have any executions yet (refresh this
                    page to load new executions).
                </Tooltip>
            )}
        </>
    );
}
