export const styles = [
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
    {
        selector: "node.domain",
        style: {
            backgroundColor: "#e37f78",
        },
    },
];
