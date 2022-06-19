import "./App.css";
import "bootstrap/dist/css/bootstrap.css";

import { useState, useEffect } from "react";
import { getRecord, getRecordIds } from "./api";
import { Modal, ModalHeader, ModalBody, Collapse } from "reactstrap";
import { RecordList } from "./RecordList";
import { Filter } from "./Filter";
import { CreateWebsiteRecordForm } from "./CreateWebsiteRecord";
import { IWebsiteRecord } from "ts-types";

function App() {
    const [records, setRecords] = useState<Array<IWebsiteRecord>>([]);
    const [filteredRecords, setFilteredRecords] = useState<
        Array<IWebsiteRecord>
    >([]);
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
        <div className="App">
            <header className="bg-info bg-gradient">
                <h1>Web crawler</h1>
            </header>
            <main>
                <h1>Website records</h1>
                <button
                    className="btn btn-secondary mb-3"
                    onClick={toggleFilterCollapseIsOpen}
                >
                    Filters
                </button>
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
                />
                <button
                    className="btn btn-success create-btn"
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
        </div>
    );
}

export default App;
