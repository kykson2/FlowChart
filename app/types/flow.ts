export interface FlowNode {
    id: string;
    type: 'start' | 'process' | 'decision' | 'end' | 'document' | 'input' | 'output';
    lable: string;
    metadata: Record<string, string>;
    position: { x: number; y: number };
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    type: string;
    metadata: Record<string, string>;
}

export interface FlowTableData {
    nodes: FlowNode[];
    edges: FlowEdge[];
    settings: Record<string, string>;
    metadata: Record<string, string>;
}


