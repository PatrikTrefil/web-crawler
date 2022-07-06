import { List } from "reactstrap";
import { IWebsiteRecord } from "ts-types";

export default function RecordDetails({
    recordToDisplay,
}: {
    recordToDisplay: IWebsiteRecord | undefined;
}) {
    if (recordToDisplay === undefined)
        return <div>No record to displayed, undefined given.</div>;
    return (
        <>
            <List type="unstyled">
                <li>ID: {recordToDisplay.id}</li>
                <li>URL: {recordToDisplay.url}</li>
                <li>Label: {recordToDisplay.label}</li>
                <li>Boundary regex: {recordToDisplay.boundaryRegex}</li>
                <li>Is active?: {recordToDisplay.isActive ? "yes" : "no"}</li>
                <li>Periodicity: {recordToDisplay.periodicityInSeconds} s</li>
                <li>Tags: {recordToDisplay.tags.join(", ")}</li>
            </List>
        </>
    );
}
