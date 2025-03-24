'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  applyNodeChanges,
  Handle,
  NodeProps,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowTableData } from '../types/flow';

interface FlowChartProps {
  data: FlowTableData;
  onNodePositionChange?: (nodeId: string, position: { x: number; y: number }) => void;
}

// 시작/종료 노드 컴포넌트 (타원형)
const StartEndNode = ({ data }: NodeProps) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          background: '#f3f4f6',
          color: '#000',
          border: '2px solid #000',
          width: '120px',
          height: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

// 처리 노드 컴포넌트 (직사각형)
const ProcessNode = ({ data }: NodeProps) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          background: '#f3f4f6',
          color: '#000',
          border: '2px solid #000',
          width: '150px',
          minHeight: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px',
          fontSize: '14px',
          textAlign: 'center',
        }}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

// 조건 노드 컴포넌트 (마름모)
const DecisionNode = ({ data }: NodeProps) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          background: '#f3f4f6',
          color: '#000',
          border: '2px solid #000',
          width: '120px',
          height: '120px',
          transform: 'rotate(45deg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div style={{ transform: 'rotate(-45deg)', padding: '10px', textAlign: 'center', fontSize: '14px' }}>
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
};

// 입출력 노드 컴포넌트 (평행사변형)
const InputOutputNode = ({ data }: NodeProps) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          background: '#f3f4f6',
          color: '#000',
          border: '2px solid #000',
          width: '150px',
          height: '60px',
          transform: 'skew(-20deg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ transform: 'skew(20deg)', fontSize: '14px' }}>
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

// 문서 노드 컴포넌트 (물결 문서)
const DocumentNode = ({ data }: NodeProps) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          background: '#f3f4f6',
          color: '#000',
          border: '2px solid #000',
          width: '150px',
          minHeight: '80px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px',
          borderRadius: '8px 8px 0 0',
          fontSize: '14px',
        }}
      >
        <div style={{ textAlign: 'center' }}>{data.label}</div>
        <div
          style={{
            position: 'absolute',
            bottom: '-15px',
            left: 0,
            width: '100%',
            height: '20px',
            backgroundColor: '#f3f4f6',
            borderBottom: '2px solid #000',
            borderBottomLeftRadius: '50%',
            borderBottomRightRadius: '50%',
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} style={{ bottom: -15 }} />
    </>
  );
};

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  process: ProcessNode,
  decision: DecisionNode,
  input: InputOutputNode,
  output: InputOutputNode,
  document: DocumentNode,
};

const nodeColors = {
  start: '#E8F5E9',    // 연한 초록색
  process: '#E3F2FD',  // 연한 파란색
  decision: '#FFF8E1', // 연한 노란색
  end: '#FFEBEE',      // 연한 빨간색
  document: '#F3E5F5', // 연한 보라색
  input: '#FFF3E0',    // 연한 주황색
  output: '#EFEBE9',   // 연한 갈색
};

const nodeTextColors = {
  start: '#2E7D32',    // 진한 초록색
  process: '#1976D2',  // 진한 파란색
  decision: '#F57F17', // 진한 노란색
  end: '#D32F2F',      // 진한 빨간색
  document: '#7B1FA2', // 진한 보라색
  input: '#E65100',    // 진한 주황색
  output: '#4E342E',   // 진한 갈색
};

const nodeShapes = {
  start: 'rounded',
  process: 'rounded',
  decision: 'diamond',
  end: 'rounded',
  document: 'rounded',
  input: 'rounded',
  output: 'rounded',
};

const calculateNodePositions = (nodes: Node[], edges: Edge[]) => {
  const nodePositions = new Map<string, { x: number; y: number }>();
  const VERTICAL_SPACING = 150;
  const HORIZONTAL_SPACING = 250;

  // 시작 노드 찾기 (data.type이 'start'인 노드)
  const startNode = nodes.find(n => n.data?.type === 'start' || n.type === 'start');
  if (!startNode) return nodePositions;

  // 시작 노드 위치 설정
  nodePositions.set(startNode.id, { x: 0, y: 0 });

  // 각 노드의 레벨 계산
  const nodeLevels = new Map<string, number>();
  const visited = new Set<string>();

  const calculateLevel = (nodeId: string, level: number) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    nodeLevels.set(nodeId, level);

    // 나가는 엣지 찾기
    const outgoingEdges = edges.filter(e => e.source === nodeId);
    outgoingEdges.forEach(edge => {
      calculateLevel(edge.target, level + 1);
    });
  };

  calculateLevel(startNode.id, 0);

  // 각 레벨별 노드 수 계산
  const levelCounts = new Map<number, number>();
  nodeLevels.forEach((level, nodeId) => {
    levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
  });

  // 각 노드의 위치 계산
  const levelPositions = new Map<number, number>();
  const processedNodes = new Set<string>();

  const calculatePosition = (nodeId: string) => {
    if (processedNodes.has(nodeId)) return;
    processedNodes.add(nodeId);

    const level = nodeLevels.get(nodeId) || 0;
    const count = levelCounts.get(level) || 1;
    const position = levelPositions.get(level) || 0;
    
    // x 좌표는 레벨에 따라 결정
    const x = level * HORIZONTAL_SPACING;
    
    // y 좌표는 레벨 내에서의 위치에 따라 결정
    const y = position * VERTICAL_SPACING;

    nodePositions.set(nodeId, { x, y });
    levelPositions.set(level, (levelPositions.get(level) || 0) + 1);

    // 자식 노드들의 위치 계산
    const outgoingEdges = edges.filter(e => e.source === nodeId);
    outgoingEdges.forEach(edge => {
      calculatePosition(edge.target);
    });
  };

  calculatePosition(startNode.id);

  // 연결되지 않은 노드들의 위치 계산
  let lastX = Math.max(...Array.from(nodePositions.values()).map(pos => pos.x)) + HORIZONTAL_SPACING;
  let lastY = 0;

  nodes.forEach(node => {
    if (!nodePositions.has(node.id)) {
      nodePositions.set(node.id, { x: lastX, y: lastY });
      lastY += VERTICAL_SPACING;
    }
  });

  return nodePositions;
};

export default function FlowChart({ data, onNodePositionChange }: FlowChartProps) {
  // 노드 데이터 변환
  const initialNodes: Node[] = useMemo(() => {
    // 노드 위치 계산
    const nodePositions = calculateNodePositions(
      data.nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: { 
          label: node.label,
          type: node.type,
        },
        position: node.position || { x: 0, y: 0 }
      })),
      data.edges
    );

    const nodes = data.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: nodePositions.get(node.id) || node.position || { x: 0, y: 0 },
      data: {
        label: node.label,
        meaning: node.metadata?.meaning || '',
        type: node.type,
      },
    }));

    return nodes;
  }, [data.nodes, data.edges]);

  // 엣지 데이터 변환
  const initialEdges: Edge[] = useMemo(() => data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'default',
    style: { 
      stroke: '#000', 
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#000',
    },
  })), [data.edges]);

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 노드 변경 시 부모 컴포넌트에 알림
  const handleNodesChange = useCallback((changes: any) => {
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.position && onNodePositionChange) {
        onNodePositionChange(change.id, {
          x: Math.round(change.position.x),
          y: Math.round(change.position.y)
        });
      }
    });
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [setNodes, onNodePositionChange]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#ffffff' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'default',
          style: { 
            stroke: '#000', 
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#000',
          },
        }}
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: true,
        }}
      >
        <Background color="#e5e7eb" gap={16} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
} 