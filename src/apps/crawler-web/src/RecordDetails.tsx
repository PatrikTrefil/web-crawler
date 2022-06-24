import { List } from "reactstrap";
import { IWebsiteRecord } from "ts-types";

export default function RecordDetails({
    recordToDisplay,
}: {
    recordToDisplay: IWebsiteRecord;
}) {
    return (
        <>
            <List type="unstyled">
                <li>ID: {recordToDisplay.id}</li>
                <li>URL: {recordToDisplay.url}</li>
                <li>Label: {recordToDisplay.label}</li>
                <li>Boundary regex: {recordToDisplay.boundaryRegex}</li>
                <li>Is active?: {recordToDisplay.isActive}</li>
                <li>Periodicity: {recordToDisplay.periodicityInSeconds} s</li>
                <li>Tags: {recordToDisplay.tags.join(", ")}</li>
            </List>
        </>
    );
}
