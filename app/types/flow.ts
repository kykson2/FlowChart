export interface FlowNode {
    id: string;
    type: 'start' | 'process' | 'decision' | 'end' | 'document' | 'input' | 'output';
    label: string;
    position: {
        x: number;
        y: number;
    };
    metadata: {
        meaning?: string;
        [key: string]: any;
    };
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    metadata?: {
        [key: string]: any;
    };
}

export interface FlowTableData {
    nodes: FlowNode[];
    edges: FlowEdge[];
    settings: {
        [key: string]: any;
    };
    metadata: {
        [key: string]: any;
    };
}


