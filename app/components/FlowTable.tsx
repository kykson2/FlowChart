'use client';

import { useState } from 'react';
import { FlowNode, FlowEdge, FlowTableData } from '../types/flow';
import FlowChart from './FlowChart';

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

export default function FlowTable() {
  const [data, setData] = useState<FlowTableData>({
    nodes: [
      {
        id: '1',
        type: 'start',
        label: '시작',
        position: { x: 0, y: 0 },
        metadata: {
          meaning: ''
        }
      }
    ],
    edges: [],
    settings: {},
    metadata: {}
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);

  const handleNodeUpdate = (nodeId: string, field: keyof FlowNode, value: any) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, [field]: value } : node
      )
    }));
  };

  const handleEdgeUpdate = (edgeId: string, field: keyof FlowEdge, value: any) => {
    setData(prev => ({
      ...prev,
      edges: prev.edges.map(edge => 
        edge.id === edgeId ? { ...edge, [field]: value } : edge
      )
    }));
  };

  const addNode = () => {
    const newId = String(data.nodes.length + 1);
    const lastNode = data.nodes[data.nodes.length - 1];
    
    // 마지막 노드의 위치를 기준으로 새 노드의 위치 계산
    const newPosition = {
      x: (lastNode?.position?.x ?? 0) + 250,  // 수평 간격
      y: (lastNode?.position?.y ?? 0) + 150   // 수직 간격
    };

    // 시작 노드가 아닌 경우에만 위치 조정
    if (lastNode?.type !== 'start') {
      // 마지막 노드의 연결된 노드 수에 따라 위치 조정
      const connectedNodes = data.edges.filter(edge => 
        edge.source === lastNode.id || edge.target === lastNode.id
      ).length;

      newPosition.y += connectedNodes * 100; // 연결된 노드 수에 따라 수직 간격 조정
    }

    const newNode: FlowNode = {
      id: newId,
      type: 'process',
      label: `노드 ${newId}`,
      position: newPosition,
      metadata: {
        meaning: ''
      }
    };

    setData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  };

  const addEdge = () => {
    const newId = `edge-${data.edges.length + 1}`;
    setData(prev => ({
      ...prev,
      edges: [
        ...prev.edges,
        {
          id: newId,
          source: '',
          target: '',
          label: '',
          type: 'default',
          metadata: {}
        }
      ]
    }));
  };

  const getNodeConnections = (nodeId: string) => {
    const incomingEdges = data.edges.filter(edge => edge.target === nodeId);
    const outgoingEdges = data.edges.filter(edge => edge.source === nodeId);
    
    return {
      in: incomingEdges[0]?.source || '',
      out: outgoingEdges[0]?.target || '',
      inLabel: incomingEdges[0] ? `${data.nodes.find(n => n.id === incomingEdges[0].source)?.label} (${incomingEdges[0].source})` : '',
      outLabel: outgoingEdges[0] ? `${data.nodes.find(n => n.id === outgoingEdges[0].target)?.label} (${outgoingEdges[0].target})` : ''
    };
  };

  const handleConnectStart = (nodeId: string) => {
    setSelectedNode(nodeId);
    setIsConnecting(true);
  };

  const handleConnectEnd = (targetNodeId: string) => {
    if (isConnecting && selectedNode && selectedNode !== targetNodeId) {
      const newEdgeId = `edge-${data.edges.length + 1}`;
      setData(prev => ({
        ...prev,
        edges: [
          ...prev.edges,
          {
            id: newEdgeId,
            source: selectedNode,
            target: targetNodeId,
            label: '',
            type: 'default',
            metadata: {}
          }
        ]
      }));
    }
    setSelectedNode(null);
    setIsConnecting(false);
  };

  const removeConnection = (nodeId: string, isIncoming: boolean) => {
    setData(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => 
        isIncoming 
          ? !(edge.target === nodeId)
          : !(edge.source === nodeId)
      )
    }));
  };

  const getAvailableNodes = (currentNodeId: string, isIncoming: boolean) => {
    return data.nodes
      .filter(node => node.id !== currentNodeId)
      .map(node => ({
        id: node.id,
        label: `${node.label} (${node.id})`
      }));
  };

  const handleConnectionChange = (nodeId: string, isIncoming: boolean, targetNodeId: string) => {
    if (!targetNodeId) {
      // 연결 해제
      setData(prev => ({
        ...prev,
        edges: prev.edges.filter(edge => 
          isIncoming 
            ? edge.target !== nodeId
            : edge.source !== nodeId
        )
      }));
      return;
    }

    // 기존 연결 제거
    const newEdges = data.edges.filter(edge => 
      isIncoming 
        ? edge.target !== nodeId
        : edge.source !== nodeId
    );

    // 새로운 연결 추가
    const newEdgeId = `edge-${data.edges.length + 1}`;
    setData(prev => ({
      ...prev,
      edges: [
        ...newEdges,
        {
          id: newEdgeId,
          source: isIncoming ? targetNodeId : nodeId,
          target: isIncoming ? nodeId : targetNodeId,
          label: '',
          type: 'default',
          metadata: {}
        }
      ]
    }));
  };

  const copyToClipboard = (text: string) => {
    try {
      // 임시 textarea 엘리먼트 생성
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      
      // 텍스트 선택
      textarea.select();
      textarea.setSelectionRange(0, 99999); // 모바일 지원
      
      // 복사 실행
      document.execCommand('copy');
      
      // 임시 엘리먼트 제거
      document.body.removeChild(textarea);
      
      alert('JSON 데이터가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert('클립보드 복사에 실패했습니다. JSON 데이터를 직접 복사해주세요.');
    }
  };

  const handleNodePositionChange = (nodeId: string, position: { x: number; y: number }) => {
    if (!position) return;  // position이 undefined인 경우 처리

    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              position: { 
                x: Math.round(position?.x || 0), 
                y: Math.round(position?.y || 0) 
              } 
            } 
          : node
      )
    }));
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">플로우차트 테이블</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowChartModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm flex items-center gap-2 text-base font-medium"
          >
            <span>📊</span>
            <span>플로우차트 보기</span>
          </button>
          <button 
            onClick={() => setShowJsonModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm flex items-center gap-2 text-base font-medium"
          >
            <span>📋</span>
            <span>JSON 데이터로 보기</span>
          </button>
          <button 
            onClick={addNode}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-sm flex items-center gap-2 text-base font-medium"
          >
            <span>➕</span>
            <span>노드 추가</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-b">도형</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-b">의미</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-b">도형 안 텍스트</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-b">In</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-b">Out</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-b">위치</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.nodes.map(node => {
              const connections = getNodeConnections(node.id);
              const isSelected = selectedNode === node.id;
              const availableInNodes = getAvailableNodes(node.id, true);
              const availableOutNodes = getAvailableNodes(node.id, false);
              
              return (
                <tr 
                  key={node.id}
                  className={`${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'} ${isConnecting ? 'cursor-pointer' : ''} transition-colors duration-150`}
                  onClick={() => isConnecting && handleConnectEnd(node.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={node.type}
                      onChange={(e) => handleNodeUpdate(node.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900"
                    >
                      <option value="start">시작</option>
                      <option value="process">처리</option>
                      <option value="decision">조건</option>
                      <option value="end">종료</option>
                      <option value="document">문서</option>
                      <option value="input">입력</option>
                      <option value="output">출력</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={node.metadata.meaning || ''}
                      onChange={(e) => handleNodeUpdate(node.id, 'metadata', {
                        ...node.metadata,
                        meaning: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                      placeholder="의미 입력"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={node.label}
                      onChange={(e) => handleNodeUpdate(node.id, 'label', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <select
                          value={connections.in}
                          onChange={(e) => handleConnectionChange(node.id, true, e.target.value)}
                          disabled={node.type === 'start'}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white ${
                            node.type === 'start' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">선택하세요</option>
                          {availableInNodes.map(availableNode => (
                            <option key={availableNode.id} value={availableNode.id}>
                              {availableNode.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {connections.in && node.type !== 'start' && (
                        <button
                          onClick={() => removeConnection(node.id, true)}
                          className="p-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors duration-200 shadow-sm text-lg"
                          title="들어오는 연결 제거"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <select
                          value={connections.out}
                          onChange={(e) => handleConnectionChange(node.id, false, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 bg-white"
                        >
                          <option value="">선택하세요</option>
                          {availableOutNodes.map(availableNode => (
                            <option key={availableNode.id} value={availableNode.id}>
                              {availableNode.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {connections.out && (
                        <button
                          onClick={() => removeConnection(node.id, false)}
                          className="p-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors duration-200 shadow-sm text-lg"
                          title="나가는 연결 제거"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={node.position?.x ?? 0}
                        onChange={(e) => handleNodeUpdate(node.id, 'position', {
                          ...(node.position || { x: 0, y: 0 }),
                          x: parseInt(e.target.value) || 0
                        })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900"
                        placeholder="X"
                      />
                      <span className="text-gray-500">,</span>
                      <input
                        type="number"
                        value={node.position?.y ?? 0}
                        onChange={(e) => handleNodeUpdate(node.id, 'position', {
                          ...(node.position || { x: 0, y: 0 }),
                          y: parseInt(e.target.value) || 0
                        })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900"
                        placeholder="Y"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* JSON 모달 */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">JSON 데이터</h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                클립보드에 복사
              </button>
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플로우차트 모달 */}
      {showChartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90vw] h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">플로우차트</h3>
              <button
                onClick={() => setShowChartModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1">
              <FlowChart 
                data={data} 
                onNodePositionChange={handleNodePositionChange}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowChartModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
