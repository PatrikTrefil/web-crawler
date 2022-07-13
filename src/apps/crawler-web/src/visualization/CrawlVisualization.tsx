import "./CrawlVisualization.css";

import cytoscape from "cytoscape";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore types don't exist
import coseBilkent from "cytoscape-cose-bilkent";
import { useEffect, useRef, useState } from "react";
import { ICrawlExecution, IWebPage } from "ts-types";
import { getCrawl, getRecord } from "../api";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { startCrawl } from "../api";
import { styles } from "./CytoscapeStyles";

cytoscape.use(coseBilkent);

interface IWebPageWithSources extends IWebPage {
    sourceRecordIds: string[];
}

interface IDomainNodeData {
    domain: string;
    links: string[];
    sourceRecordIds: string[];
}

export default function CrawlVisualization() {
    const { recordIdsString, visualizationMode } = useParams() as {
        recordIdsString: string;
        visualizationMode: "website" | "domain";
    };
    const recordIds = recordIdsString.split(",");
    const [crawls, setCrawls] = useState<ICrawlExecution[]>();

    const [updateMode, setUpdateMode] = useState<"static" | "live">("static");
    const [updateIntervalId, setIntervalId] =
        useState<ReturnType<typeof setInterval>>();
    const updateIntervalLengthInSeconds = 10;

    const containerRef = useRef<HTMLDivElement>(null);
    const [cy, setCy] = useState<cytoscape.Core>();

    const [webpageForDetails, setWebpageForDetails] =
        useState<IWebPageWithSources>();
    const [domainDataForDetails, setDomainDataForDetails] =
        useState<IDomainNodeData>();
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const toggleDetailsModal = () => {
        setIsDetailsModalOpen(!isDetailsModalOpen);
    };

    useEffect(() => {
        setCy(
            cytoscape({
                container: containerRef.current,
                style: styles,
            })
        );
    }, []);
    const applyLayout = (cy: cytoscape.Core) => {
        const layout = cy.layout({
            name: "cose-bilkent",
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore no types for cose-bilkent lib
            nodeDimensionsIncludeLabels: true,
            idealEdgeLength: 1000,
            nodeRepulsion: 5_000_000,
            animate: false,
            randomize: false,
        });

        layout.run();
    };
    const webpageNodeClickHandler = (e: cytoscape.EventObject) => {
        const node = e.target;
        setWebpageForDetails(node.data().webpageData);
        toggleDetailsModal();
    };
    const domainNodeClickHandler = (e: cytoscape.EventObject) => {
        const node = e.target;
        setDomainDataForDetails(node.data().domainData);
        toggleDetailsModal();
    };
    const visualizeWebsite = (cyWebsite: cytoscape.Core) => {
        if (!crawls || !cyWebsite) return;
        cyWebsite.nodes().remove(); // complete reset

        for (const crawl of crawls)
            cyWebsite.add({
                group: "nodes",
                data: { id: crawl.id, label: crawl.id },
                classes: "crawlExecutionId",
            });
        const webpagesFromAllCrawls: IWebPageWithSources[] = [];
        for (const crawl of crawls)
            webpagesFromAllCrawls.push(
                ...crawl.nodes.map((node) => {
                    return { ...node, sourceRecordIds: [crawl.sourceRecordId] };
                })
            );

        // now we merge nodes with identical URLs and we use crawled data from the latest crawl
        const webpagesUsedForGraphing: IWebPageWithSources[] = [];

        // secondarily, we sort by crawlTime, descending
        webpagesFromAllCrawls.sort((a, b) => {
            if (!a.crawlTime && b.crawlTime) return 1;
            if (a.crawlTime && !b.crawlTime) return -1;
            if (!a.crawlTime && !b.crawlTime) return 0;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (a.crawlTime > b.crawlTime) return -1;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (a.crawlTime < b.crawlTime) return 1;
            return 0;
        });
        // primarily, we want crawled nodes first
        webpagesFromAllCrawls.sort((a, b) => {
            if (a.title !== undefined && b.title === undefined) return -1;
            if (a.title === undefined && b.title !== undefined) return 1;
            return 0;
        });

        for (const webpage of webpagesFromAllCrawls) {
            const alreadyExistingNode = webpagesUsedForGraphing.find(
                (displayedNode) => displayedNode.url === webpage.url
            );
            if (alreadyExistingNode)
                alreadyExistingNode.sourceRecordIds.push(
                    ...webpage.sourceRecordIds
                );
            else webpagesUsedForGraphing.push({ ...webpage });
        }

        for (const webpage of webpagesUsedForGraphing) {
            let displayedLabel: string;
            if (webpage.title) {
                displayedLabel = webpage.title;
            } else {
                const urlLengthLimit = 45;
                if (webpage.url.length > urlLengthLimit)
                    displayedLabel =
                        webpage.url.substring(0, urlLengthLimit - 1) + "...";
                else displayedLabel = webpage.url;
            }

            cyWebsite.add({
                group: "nodes",
                data: {
                    id: webpage.url,
                    label: displayedLabel,
                    webpageData: webpage,
                },
                classes: webpage.title ? "crawled" : "uncrawled",
            });
        }
        for (const crawl of crawls)
            cyWebsite.add({
                group: "edges",
                data: {
                    source: crawl.id,
                    target: crawl.startURL,
                },
            });
        for (const node of webpagesUsedForGraphing) {
            const setOfLinks = new Set(node.links);
            setOfLinks.forEach((link) => {
                cyWebsite.add({
                    group: "edges",
                    data: {
                        source: node.url,
                        target: link,
                    },
                });
            });
        }
        applyLayout(cyWebsite);
        cyWebsite.on(
            "tap",
            "node.crawled,node.uncrawled",
            webpageNodeClickHandler
        );
    };
    const visualizeDomain = (cyDomain: cytoscape.Core) => {
        if (!crawls || !cyDomain) return;
        cyDomain.nodes().remove(); // complete reset

        for (const crawl of crawls)
            cyDomain.add({
                group: "nodes",
                data: { id: crawl.id, label: crawl.id },
                classes: "crawlExecutionId",
            });

        const allDomainNodes: IDomainNodeData[] = [];
        for (const crawl of crawls)
            allDomainNodes.push(
                ...crawl.nodes.map((node) => {
                    return {
                        links: node.links,
                        domain: new URL(node.url).hostname,
                        sourceRecordIds: [crawl.sourceRecordId],
                    }; // domain will potentially be "" (e.g. mailto:example@web.com)
                })
            );
        // now we merge nodes with the same domain
        const uniqueDomainNodes: typeof allDomainNodes = [];
        for (const node of allDomainNodes) {
            // nodes with domain === "" are ignored
            if (node.domain !== "") {
                // this implementation is slow but readable (use Map to improve speed if needed)
                const domainNode = uniqueDomainNodes.find(
                    (domainNode) => domainNode.domain === node.domain
                );
                if (domainNode) {
                    domainNode.links.push(...node.links); // we will remove duplicates later
                    for (const sourceRecordId of node.sourceRecordIds) {
                        domainNode.sourceRecordIds.push(sourceRecordId); // we will remove duplicates later
                    }
                } else uniqueDomainNodes.push(node);
            }
        }
        // add nodes to graph
        for (const domainNodeData of uniqueDomainNodes) {
            let displayedDomain: string;
            const domainLengthLimit = 45;
            if (domainNodeData.domain.length > domainLengthLimit)
                displayedDomain =
                    domainNodeData.domain.substring(0, domainLengthLimit - 1) +
                    "...";
            else displayedDomain = domainNodeData.domain;
            domainNodeData.sourceRecordIds = Array.from(
                new Set(domainNodeData.sourceRecordIds)
            );
            cyDomain.add({
                group: "nodes",
                data: {
                    id: domainNodeData.domain,
                    label: displayedDomain,
                    domainData: domainNodeData,
                },
                classes: "domain",
            });
        }

        for (const node of uniqueDomainNodes) {
            const setOfLinks = new Set(
                node.links.map((link) => new URL(link).hostname)
            );
            setOfLinks.forEach((link) => {
                if (link !== "")
                    cyDomain.add({
                        group: "edges",
                        data: {
                            source: node.domain,
                            target: link,
                        },
                    });
            });
        }

        for (const crawl of crawls)
            cyDomain.add({
                group: "edges",
                data: {
                    source: crawl.id,
                    target: new URL(crawl.startURL).hostname,
                },
            });
        applyLayout(cyDomain);
        cyDomain.on("tap", "node.domain", domainNodeClickHandler);
    };
    const getCrawls = async () => {
        const recordsPromises = [];
        for (const recordId of recordIds) {
            recordsPromises.push(getRecord(recordId));
        }
        const records = await Promise.all(recordsPromises);
        const newCrawlsPromises = [];
        for (const record of records) {
            if (record.lastExecutionId)
                // n.b. we ignore those that don't have any executions
                newCrawlsPromises.push(getCrawl(record.lastExecutionId));
        }
        const newCrawls = await Promise.all(newCrawlsPromises);
        setCrawls(newCrawls);
    };
    useEffect(() => {
        getCrawls();
    }, []);
    useEffect(() => {
        if (updateMode === "live") {
            getCrawls();
            const intervalId = setInterval(
                getCrawls,
                updateIntervalLengthInSeconds * 1000
            );
            setIntervalId(intervalId);
            return () => clearInterval(intervalId);
        } else if (updateMode === "static") {
            if (updateIntervalId) clearInterval(updateIntervalId);
        }
    }, [updateMode]);
    if (visualizationMode === "domain")
        useEffect(() => {
            if (cy) visualizeDomain(cy);
        }, [crawls]);
    else if (visualizationMode === "website")
        useEffect(() => {
            if (cy) visualizeWebsite(cy);
        }, [crawls]);

    return (
        <>
            <Link
                reloadDocument
                to={`/visualization/${
                    visualizationMode === "website" ? "domain" : "website"
                }/${recordIdsString}`}
                className="btn btn-primary position-fixed bottom-0 end-0 m-3"
                style={{ zIndex: 1 }}
            >
                Toggle website/domain mode
            </Link>
            <div ref={containerRef} className="cy"></div>
            <div className="position-fixed bottom-0 start-0 bg-primary m-3 p-3 rounded">
                <ul className="mb-0 text-white pe-2 ps-3">
                    <li>Pink nodes - crawled nodes</li>
                    <li>
                        Orange nodes - uncrawled (not within boundary regex)
                    </li>
                    <li>
                        Purple nodes - execution (has one edge pointing to the
                        starting node)
                    </li>
                    <li>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                            }}
                        >
                            <label htmlFor="updateMode">Update mode: </label>
                            <select
                                className="form-select d-inline-block w-auto ms-2"
                                name="updateMode"
                                id="updateMode"
                                value={updateMode}
                                onChange={(e) => {
                                    setUpdateMode(
                                        e.target.value as "static" | "live"
                                    );
                                }}
                            >
                                <option value="static">Static</option>
                                <option value="live">Live</option>
                            </select>
                        </form>
                    </li>
                </ul>
            </div>
            <Modal
                toggle={toggleDetailsModal}
                isOpen={isDetailsModalOpen}
                scrollable
                size="lg"
            >
                <ModalHeader toggle={toggleDetailsModal}>
                    Node details
                </ModalHeader>
                <ModalBody>
                    {visualizationMode === "domain" && (
                        <DomainDetails domainData={domainDataForDetails} />
                    )}
                    {visualizationMode === "website" && (
                        <WebpageDetails webpage={webpageForDetails} />
                    )}
                </ModalBody>
            </Modal>
        </>
    );
}

function DomainDetails({
    domainData,
}: {
    domainData: IDomainNodeData | undefined;
}) {
    if (domainData === undefined)
        return <div>No domain data selected. Something went wrong.</div>;
    return (
        <ul>
            <li>domain: {domainData.domain}</li>
            <li>
                source records:
                <ul>
                    {domainData.sourceRecordIds.map((sourceRecordId) => (
                        <li key={sourceRecordId}>
                            {sourceRecordId}
                            <button
                                className="btn btn-success m-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    startCrawl(sourceRecordId);
                                }}
                            >
                                Start crawl
                            </button>
                        </li>
                    ))}
                </ul>
            </li>
            <li>
                links (each link listed only once):
                <ul>
                    {Array.from(new Set(domainData.links)).map((link) => {
                        return <li key={link}>{link}</li>;
                    })}
                </ul>
            </li>
        </ul>
    );
}

function WebpageDetails({
    webpage,
}: {
    webpage: IWebPageWithSources | undefined;
}) {
    if (webpage === undefined)
        return <div>No webpage selected. Something went wrong.</div>;
    return (
        <ul>
            <li>url: {webpage.url}</li>
            <li>
                source records:
                <ul>
                    {webpage.sourceRecordIds.map((sourceRecordId) => (
                        <li key={sourceRecordId}>
                            {sourceRecordId}
                            <button
                                className="btn btn-success"
                                onClick={(e) => {
                                    e.preventDefault();
                                    startCrawl(sourceRecordId);
                                }}
                            >
                                Start crawl
                            </button>
                        </li>
                    ))}
                </ul>
            </li>
            {webpage.title && <li>title: {webpage.title}</li>}
            <li>
                links (each link listed once):
                <ul>
                    {Array.from(new Set(webpage.links)).map((link) => {
                        return <li key={link}>{link}</li>;
                    })}
                </ul>
            </li>
        </ul>
    );
}
