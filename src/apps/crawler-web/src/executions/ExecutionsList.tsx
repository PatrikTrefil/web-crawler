import { useState, useEffect } from "react";
import { ICrawlExecution } from "ts-types";
import ReactPaginate from "react-paginate";

export default function ExecutionsList({
    executions,
    isLoadingExecutions,
    errorMsgExecutionsLoading,
    itemsPerPage,
}: {
    executions: ICrawlExecution[];
    isLoadingExecutions: boolean;
    errorMsgExecutionsLoading: string;
    itemsPerPage: number;
}) {
    const [currentlyDisplayedExecutions, setCurrentlyDisplayedExecutions] =
        useState<Array<ICrawlExecution>>([]);

    const [pageCount, setPageCount] = useState(0);
    const [itemOffset, setItemOffset] = useState(0);
    const [pageIndex, setPageIndex] = useState(-1); // zero based, use this to override current page; -1 means there are no pages

    // updating of page count
    useEffect(() => {
        setPageCount(Math.ceil(executions.length / itemsPerPage));
    }, [executions, itemsPerPage]);
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
        const endOffset = itemOffset + itemsPerPage;
        const executionsCopy = [...executions];
        setCurrentlyDisplayedExecutions(
            executionsCopy.slice(itemOffset, endOffset)
        );
    }, [executions, isLoadingExecutions, itemOffset, itemsPerPage]);

    const handlePageClick = (selectedItem: { selected: number }) => {
        const newOffset =
            (selectedItem.selected * itemsPerPage) % executions.length;
        setItemOffset(newOffset);
    };
    return (
        <>
            <Page
                executionsOfPage={currentlyDisplayedExecutions}
                executions={executions}
                errorMsgExecutionsLoading={errorMsgExecutionsLoading}
                isLoading={isLoadingExecutions}
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
    executionsOfPage: Array<ICrawlExecution>;
    executions: Array<ICrawlExecution>;
    errorMsgExecutionsLoading: string;
    isLoading: boolean;
}) {
    if (props.errorMsgExecutionsLoading)
        return (
            <div className="alert alert-danger">
                {props.errorMsgExecutionsLoading}
            </div>
        );

    if (props.isLoading) return <div className="text-center">Loading ...</div>;

    if (props.executionsOfPage.length > 0) {
        const recordList = props.executionsOfPage.map((execution) => {
            return (
                <li className="list-group-item" key={execution.id}>
                    <div>
                        {execution.startURL}{" "}
                        <span className="text-secondary">({execution.id})</span>
                    </div>
                </li>
            );
        });
        return (
            <>
                <ul className="record-list list-group">{recordList}</ul>
            </>
        );
    }
    return <div className="text-center">No executions exist.</div>;
}
