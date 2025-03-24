'use client';

import { useState } from 'react';
import { FlowNode, FlowEdge, FlowTableData } from '../types/flow';

export default function FlowTable() {
  const [data, setData] = useState<FlowTableData>({
    nodes: [
      {
        id: '1',
        type: 'start',
        lable: '시작',
        metadata: {},
        position: { x: 0, y: 0 }
      }
    ],
    edges: [],
    settings: {},
    metadata: {}
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

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
    setData(prev => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        {
          id: newId,
          type: 'process',
          lable: `노드 ${newId}`,
          metadata: {},
          position: { x: 0, y: 0 }
        }
      ]
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
      in: incomingEdges[0]?.source || '',  // 첫 번째 incoming edge의 source ID
      out: outgoingEdges[0]?.target || '', // 첫 번째 outgoing edge의 target ID
      inLabel: incomingEdges[0] ? `${data.nodes.find(n => n.id === incomingEdges[0].source)?.lable} (${incomingEdges[0].source})` : '',
      outLabel: outgoingEdges[0] ? `${data.nodes.find(n => n.id === outgoingEdges[0].target)?.lable} (${outgoingEdges[0].target})` : ''
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
    // 현재 노드와 자기 자신을 제외한 모든 노드 반환
    return data.nodes
      .filter(node => node.id !== currentNodeId)
      .map(node => ({
        id: node.id,
        label: `${node.lable} (${node.id})`
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

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">플로우차트 테이블</h2>
        <div className="flex gap-4">
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
                      value={node.lable}
                      onChange={(e) => handleNodeUpdate(node.id, 'lable', e.target.value)}
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
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                  alert('JSON 데이터가 클립보드에 복사되었습니다.');
                }}
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
    </div>
  );
}
