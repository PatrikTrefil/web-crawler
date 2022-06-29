import "./CrawlVisualization.css";

import cytoscape from "cytoscape";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore types don't exist
import coseBilkent from "cytoscape-cose-bilkent";
import { useEffect, useRef, useState } from "react";
import { ICrawlExecution } from "ts-types";
import { getCrawl } from "./api";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

cytoscape.use(coseBilkent);

export default function CrawlVisualization() {
    const { crawlId, visualizationMode } = useParams() as {
        crawlId: string;
        visualizationMode: "website" | "domain";
    };
    const [crawl, setCrawl] = useState<ICrawlExecution>();
    const containerRef = useRef<HTMLDivElement>(null);
    const styles = [
        {
            selector: "node[label]",
            style: {
                label: "data(label)",
                width: 30,
                height: 30,
            },
        },
        {
            selector: "edge",
            style: {
                "curve-style": "bezier",
                "control-point-step-size": 40,
                "line-color": "#20c997",
                "target-arrow-shape": "triangle",
                "target-arrow-color": "#20c997",
            },
        },
        {
            selector: "node.crawlExecutionId",
            style: {
                "background-color": "#8232ba",
                width: 50,
                height: 50,
            },
        },
        {
            selector: "node.uncrawled",
            style: {
                backgroundColor: "#ebb842",
            },
        },
        {
            selector: "node.crawled",
            style: {
                backgroundColor: "#d63384",
            },
        },
    ];
    const [cy, setCy] = useState<cytoscape.Core>();
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
    const visualizeWebsite = (cyWebsite: cytoscape.Core) => {
        if (!crawl || !cyWebsite) return;
        cyWebsite.add({
            group: "nodes",
            data: { id: crawl.id, label: crawl.id },
            classes: "crawlExecutionId",
        });
        for (const node of crawl.nodes) {
            let displayedUrl: string;
            const urlLengthLimit = 45;
            if (node.url.length > urlLengthLimit)
                displayedUrl =
                    node.url.substring(0, urlLengthLimit - 1) + "...";
            else displayedUrl = node.url;
            cyWebsite.add({
                group: "nodes",
                data: {
                    id: node.url,
                    label: displayedUrl,
                },
                classes: node.title ? "crawled" : "uncrawled",
            });
        }
        cyWebsite.add({
            group: "edges",
            data: {
                source: crawl.id,
                target: crawl.startURL,
            },
        });
        for (const node of crawl.nodes) {
            for (const link of node.links) {
                cyWebsite.add({
                    group: "edges",
                    data: {
                        source: node.url,
                        target: link,
                    },
                });
            }
        }
        applyLayout(cyWebsite);
    };
    const visualizeDomain = (cyDomain: cytoscape.Core) => {
        if (!crawl || !cyDomain) return;
        cyDomain.add({
            group: "nodes",
            data: { id: crawl.id, label: crawl.id },
            classes: "crawlExecutionId",
        });
        const allDomainNodes = crawl.nodes.map((node) => {
            return { ...node, domain: new URL(node.url).hostname }; // domain will potentially be "" (e.g. mailto:example@web.com)
        });
        const uniqueDomainNodes: typeof allDomainNodes = [];
        for (const node of allDomainNodes) {
            if (node.domain !== "") {
                const domainNode = uniqueDomainNodes.find(
                    (domainNode) => domainNode.domain === node.domain
                );
                if (domainNode) domainNode.links.push(...node.links);
                else uniqueDomainNodes.push(node);
            }
        }
        for (const node of uniqueDomainNodes) {
            let displayedDomain: string;
            const domainLengthLimit = 45;
            if (node.domain.length > domainLengthLimit)
                displayedDomain =
                    node.domain.substring(0, domainLengthLimit - 1) + "...";
            else displayedDomain = node.url;
            cyDomain.add({
                group: "nodes",
                data: {
                    id: node.url,
                    label: displayedDomain,
                },
            });
        }
        for (const node of uniqueDomainNodes) {
            for (const link of node.links) {
                const target = new URL(link).hostname;
                if (target !== "")
                    cyDomain.add({
                        group: "edges",
                        data: {
                            source: node.domain,
                            target: target,
                        },
                    });
            }
        }

        cyDomain.add({
            group: "edges",
            data: {
                source: crawl.id,
                target: new URL(crawl.startURL).hostname,
            },
        });
        applyLayout(cyDomain);
    };
    useEffect(() => {
        const getData = async () => {
            setCrawl(await getCrawl(crawlId));
        };
        getData();
    }, []);
    if (visualizationMode === "domain")
        useEffect(() => {
            if (cy) visualizeDomain(cy);
        }, [crawl]);
    else if (visualizationMode === "website")
        useEffect(() => {
            if (cy) visualizeWebsite(cy);
        }, [crawl]);

    return (
        <>
            <Link
                reloadDocument
                to={`/visualization/${
                    visualizationMode === "website" ? "domain" : "website"
                }/${crawlId}`}
                className="btn btn-primary btn-left-down"
            >
                Toggle website/domain mode
            </Link>
            <div ref={containerRef} className="cy"></div>
        </>
    );
}
