import { IWebsiteRecord } from "ts-types";
import { useState, useRef, FormEvent } from "react";
import { updateWebsiteRecord } from "../api";
import { isValidRegex } from "../utility";

export default function EditRecord({
    recordToEdit,
    setRecordToEdit,
    records,
    setRecords,
    afterSubmit,
}: {
    recordToEdit: IWebsiteRecord;
    // eslint-disable-next-line no-unused-vars
    setRecordToEdit: (record: IWebsiteRecord) => void;
    records: IWebsiteRecord[];
    // eslint-disable-next-line no-unused-vars
    setRecords: (records: IWebsiteRecord[]) => void;
    afterSubmit: () => void;
}) {
    const [url, setUrl] = useState(recordToEdit.url);
    const [label, setLabel] = useState(recordToEdit.label);
    const [boundaryRegex, setBoundaryRegex] = useState(
        recordToEdit.boundaryRegex
    );
    const [periodicityInSecondsString, setPeriodicityInSecondsString] =
        useState(recordToEdit.periodicityInSeconds.toString());
    const [isActive, setIsActive] = useState(recordToEdit.isActive);
    const [tagsString, setTagsString] = useState(recordToEdit.tags.join(","));
    const regexInputRef = useRef<HTMLInputElement>(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [isErrorMessDisplayed, setIsErrorMessDisplayed] = useState(false);

    const submitForm = async (e: FormEvent<HTMLFormElement>) => {
        if (regexInputRef.current === null) {
            /* this should never happen, because this function is only called
               after the first render, so the ref should be set */
            setErrorMessage("Something went wrong");
            setIsErrorMessDisplayed(true);
            return;
        }
        e.preventDefault();
        setIsErrorMessDisplayed(false);
        if (!isValidRegex(boundaryRegex)) {
            regexInputRef.current.setCustomValidity("Invalid regex");
            regexInputRef.current.reportValidity();
            return;
        } else {
            regexInputRef.current.setCustomValidity("");
        }
        const recordUpdate = {
            url: url,
            label: label,
            boundaryRegex: boundaryRegex,
            periodicityInSeconds: parseInt(periodicityInSecondsString),
            isActive: isActive,
            tags:
                tagsString === ""
                    ? []
                    : tagsString.split(",").map((tag) => tag.trim()),
        };
        try {
            await updateWebsiteRecord(recordToEdit.id, recordUpdate);
        } catch (e) {
            if (e instanceof Error) setErrorMessage(e.message);
            else setErrorMessage("Unknown error");

            setIsErrorMessDisplayed(true);
            return;
        }
        const withDeletedEditedRecord = records.filter(
            (record) => record.id !== recordToEdit.id
        );
        const editedRecord: IWebsiteRecord = {
            id: recordToEdit.id,
            ...recordUpdate,
            lastExecutionId: recordToEdit.lastExecutionId,
        };
        setRecordToEdit(editedRecord);
        setRecords([...withDeletedEditedRecord, editedRecord]);
        afterSubmit();
    };
    return (
        <>
            {isErrorMessDisplayed && (
                <div className="alert alert-danger">{errorMessage}</div>
            )}
            <div>
                ID
                <br />
                {recordToEdit.id}
            </div>
            <form onSubmit={submitForm}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="url">
                        URL
                    </label>
                    <input
                        id="url"
                        name="url"
                        type="url"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        required={true}
                        className="form-control"
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="label">
                        Label
                    </label>
                    <input
                        id="label"
                        name="label"
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        required={true}
                        className="form-control"
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="boundary-regex">
                        Boundary regex
                    </label>
                    <input
                        id="boundary-regex"
                        name="boundary-regex"
                        type="text"
                        value={boundaryRegex}
                        onChange={(e) => {
                            e.target.setCustomValidity("");
                            // ^ this is necessary (it appears that all submit events are blocked until we reset it)
                            setBoundaryRegex(e.target.value);
                        }}
                        ref={regexInputRef}
                        required={true}
                        className="form-control"
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="periodicity">
                        Periodicity in seconds
                    </label>
                    <input
                        id="periodicity"
                        name="periodicity"
                        type="number"
                        min="0"
                        value={periodicityInSecondsString}
                        onChange={(e) =>
                            setPeriodicityInSecondsString(e.target.value)
                        }
                        required={true}
                        className="form-control"
                    />
                </div>
                <div className="form-check mb-3">
                    <input
                        type="checkbox"
                        name="active"
                        id="active"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="form-check-input"
                    />
                    <label className="form-check-label" htmlFor="active">
                        Is active?
                    </label>
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="tags">
                        Tags (comma-separated list)
                    </label>
                    {/* comma separated list of non-empty alpha-numeric strings */}
                    <input
                        id="tags"
                        name="tags"
                        type="text"
                        pattern="^(([a-zA-Z0-9]+)(,[a-zA-Z0-9]+)*|[a-zA-Z0-9]*)$"
                        value={tagsString}
                        onChange={(e) => setTagsString(e.target.value)}
                        className="form-control"
                    />
                </div>
                <button type="submit" className="btn btn-primary mt-3">
                    Submit
                </button>
            </form>
        </>
    );
}
