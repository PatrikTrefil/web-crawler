import "./RecordsPage.css";
import "bootstrap/dist/css/bootstrap.css";

import { useState, useEffect } from "react";
import { getRecord, getRecordIds } from "../api";
import { Modal, ModalHeader, ModalBody, Collapse } from "reactstrap";
import { RecordList } from "./RecordList";
import { Filter } from "./FilterRecords";
import { CreateWebsiteRecordForm } from "./CreateRecord";
import { ICrawlExecution, IWebsiteRecord } from "ts-types";
import SortSelect from "./SortRecords";

export type SortRecordFunction = (
    // eslint-disable-next-line no-unused-vars
    a: IWebsiteRecord & { lastExecution: ICrawlExecution | null },
    // eslint-disable-next-line no-unused-vars
    b: IWebsiteRecord & { lastExecution: ICrawlExecution | null }
) => number;

function RecordsPage() {
    const [records, setRecords] = useState<Array<IWebsiteRecord>>([]);
    const [filteredRecords, setFilteredRecords] = useState<
        Array<IWebsiteRecord>
    >([]);
    const sortFunctions: {
        url: SortRecordFunction;
        lastTimeOfCrawl: SortRecordFunction;
    } = {
        url: (a: IWebsiteRecord, b: IWebsiteRecord) => {
            if (a.url < b.url) return -1;
            else if (a.url > b.url) return 1;
            return 0;
        },
        lastTimeOfCrawl: (
            a: IWebsiteRecord & { lastExecution: ICrawlExecution | null },
            b: IWebsiteRecord & { lastExecution: ICrawlExecution | null }
        ) => {
            if (a.lastExecution === null) {
                if (b.lastExecution === null) return 0;
                return 1;
            } else {
                if (b.lastExecution === null) return -1;
                const aEndOfExecution = Math.max(
                    ...a.lastExecution.nodes.map(
                        (node) => node.crawlTime?.getTime() ?? 0
                    )
                );
                const bEndOfExecution = Math.max(
                    ...b.lastExecution.nodes.map(
                        (node) => node.crawlTime?.getTime() ?? 0
                    )
                );
                console.log("a end:", aEndOfExecution);
                console.log("b end:", bEndOfExecution);
                if (aEndOfExecution < bEndOfExecution) return 1;
                else if (aEndOfExecution > bEndOfExecution) return -1;
                return 0;
            }
        },
    };
    const [sortFunction, setSortFunction] = useState<SortRecordFunction>(
        sortFunctions["url"]
    );
    const [isLoadingRecords, setIsLoadingRecords] = useState(true);

    const [errorMsgRecordLoading, setErrorMsgRecordLoading] = useState(""); // empty string => no errors

    const [_errorModalContent, setErrorModalContent] = useState(""); // don't access this direclty, use showErrorMessage instead
    const [_errorModalIsOpen, setErrorModalIsOpen] = useState(false); // don't access this direclty, use showErrorMessage instead

    const [createModalIsOpen, setCreateModalIsOpen] = useState(false);

    const [filterCollapseIsOpen, setFilterCollapseIsOpen] = useState(false);

    // Utility functions
    const toggleCreateModal = () => {
        setCreateModalIsOpen(!createModalIsOpen);
    };
    const openCreateModal = () => {
        setCreateModalIsOpen(true);
    };
    const closeCreateModal = () => {
        setCreateModalIsOpen(false);
    };
    const openErrorModal = () => {
        setErrorModalIsOpen(true);
    };
    const toggleErrorModal = () => {
        setErrorModalIsOpen(!_errorModalIsOpen);
    };
    const showErrorMessage = (message: string) => {
        setErrorModalContent(message);
        openErrorModal();
    };
    const toggleFilterCollapseIsOpen = () => {
        setFilterCollapseIsOpen(!filterCollapseIsOpen);
    };

    // load data from the server
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
                setErrorMsgRecordLoading("Error loading records.");
            } finally {
                setIsLoadingRecords(false);
            }
        };
        getData();
    }, []);

    return (
        <main>
            <h1>Website records</h1>
            <button
                className="btn btn-secondary mb-3"
                onClick={toggleFilterCollapseIsOpen}
            >
                Filters
            </button>
            <SortSelect
                setSortFunction={setSortFunction}
                sortFunctions={sortFunctions}
            />
            <Collapse isOpen={filterCollapseIsOpen}>
                <Filter
                    records={records}
                    setFilteredRecords={setFilteredRecords}
                />
            </Collapse>
            <RecordList
                itemsPerPage={5}
                records={filteredRecords}
                setRecords={setRecords}
                showErrorMessage={showErrorMessage}
                error={errorMsgRecordLoading}
                isLoading={isLoadingRecords}
                sortFunction={sortFunction}
            />
            <button
                className="btn btn-success position-fixed bottom-0 end-0 m-3"
                onClick={openCreateModal}
            >
                Create record
            </button>
            {/* Error modal */}
            <Modal isOpen={_errorModalIsOpen} toggle={toggleErrorModal}>
                <ModalHeader toggle={toggleErrorModal}>Error</ModalHeader>
                <ModalBody>
                    <div>{_errorModalContent}</div>
                </ModalBody>
            </Modal>
            {/* Create new website record modal */}
            <Modal isOpen={createModalIsOpen} toggle={toggleCreateModal}>
                <ModalHeader toggle={toggleCreateModal}>
                    Create website record
                </ModalHeader>
                <ModalBody>
                    <CreateWebsiteRecordForm
                        records={records}
                        setRecords={setRecords}
                        afterSubmit={closeCreateModal}
                    />
                </ModalBody>
            </Modal>
        </main>
    );
}

export default RecordsPage;
