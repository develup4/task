'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/lib/store';
import TaskNode, { TaskNodeData } from './TaskNode';
import L4CategoryLegend from './L4CategoryLegend';
import { getColorForCategory } from '@/utils/colors';

const nodeTypes = {
  task: TaskNode,
} as any;

// 간단한 계층적 레이아웃 (최종 노드가 왼쪽)
const getLayoutedElements = (nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[], levels: Map<string, number> } => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  // 각 노드의 레벨 계산 (후행 노드 기준)
  const calculateLevel = (nodeId: string): number => {
    if (levels.has(nodeId)) return levels.get(nodeId)!;
    if (visited.has(nodeId)) return 0; // 순환 참조 방지

    visited.add(nodeId);

    // 이 노드로 들어오는 엣지들 찾기
    const incomingEdges = edges.filter(e => e.target === nodeId);

    if (incomingEdges.length === 0) {
      // 최종 노드 (후행이 없음)
      levels.set(nodeId, 0);
      return 0;
    }

    // 후행 노드들의 최대 레벨 + 1
    const maxSuccessorLevel = Math.max(
      ...incomingEdges.map(e => calculateLevel(e.source))
    );
    const level = maxSuccessorLevel + 1;
    levels.set(nodeId, level);
    return level;
  };

  // 모든 노드의 레벨 계산
  nodes.forEach(node => calculateLevel(node.id));

  // 레벨별로 노드 그룹화
  const levelGroups = new Map<number, Node[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  // 레이아웃 적용
  const nodeWidth = 220;
  const nodeHeight = 100;
  const horizontalSpacing = 200;
  const verticalSpacing = 120;

  const layoutedNodes = nodes.map(node => {
    const level = levels.get(node.id) || 0;
    const nodesInLevel = levelGroups.get(level) || [];
    const indexInLevel = nodesInLevel.indexOf(node);

    return {
      ...node,
      position: {
        x: level * (nodeWidth + horizontalSpacing),
        y: indexInLevel * (nodeHeight + verticalSpacing),
      },
    };
  });

  return { nodes: layoutedNodes, edges, levels };
};

export default function L5FlowGraph() {
  const {
    processedData,
    viewMode,
    selectedL5,
    highlightedTasks,
    visibleL4Categories,
    setSelectedL5,
    setViewMode,
    getFilteredL5Tasks,
  } = useAppStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);

  // 노드와 엣지 생성
  useEffect(() => {
    if (!processedData) return;

    const tasks = getFilteredL5Tasks();

    const initialNodes = tasks.map((task) => ({
      id: task.id,
      type: 'task',
      position: { x: 0, y: 0 }, // 나중에 레이아웃으로 계산
      data: {
        label: task.name,
        category: task.l4Category,
        필요인력: task.필요인력,
        필요기간: task.필요기간,
        MM: task.MM,
        cumulativeMM: task.cumulativeMM,
        isFinalNode: task.isFinalNode,
        hasCycle: task.hasCycle,
        isHighlighted: highlightedTasks.has(task.id),
        isSelected: task.id === selectedL5,
      },
    }));

    const initialEdges: Edge[] = [];
    const processedEdges = new Set<string>();

    tasks.forEach((task) => {
      task.successors.forEach((successorId) => {
        if (tasks.some((t) => t.id === successorId)) {
          const edgeId = `${task.id}-${successorId}`;
          const reverseEdgeId = `${successorId}-${task.id}`;

          const colors = getColorForCategory(task.l4Category);
          const successor = tasks.find(t => t.id === successorId);

          // 양방향 연결 체크 (cycle error)
          const isBidirectional = successor && successor.successors.includes(task.id);

          const isSelected = selectedEdge === edgeId || selectedEdge === reverseEdgeId;
          const isHidden = selectedEdge !== null && !isSelected;

          // 양방향인 경우 양쪽 화살표 모두 그리기
          if (isBidirectional) {
            // 이미 처리한 엣지는 건너뛰기
            if (processedEdges.has(edgeId) || processedEdges.has(reverseEdgeId)) {
              return;
            }

            // 정방향 엣지
            initialEdges.push({
              id: edgeId,
              source: task.id,
              target: successorId,
              type: ConnectionLineType.SmoothStep,
              animated: highlightedTasks.has(task.id) || highlightedTasks.has(successorId),
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: '#F44336',
              },
              style: {
                stroke: '#F44336',
                strokeWidth: isSelected ? 4 : 3,
                strokeDasharray: '5,5',
                opacity: isHidden ? 0.1 : 1,
              },
              label: '⚠ 양방향',
              labelStyle: { fill: '#F44336', fontWeight: 'bold' },
              labelBgStyle: { fill: '#FFEBEE' },
            });

            // 역방향 엣지
            initialEdges.push({
              id: reverseEdgeId,
              source: successorId,
              target: task.id,
              type: ConnectionLineType.SmoothStep,
              animated: highlightedTasks.has(task.id) || highlightedTasks.has(successorId),
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: '#F44336',
              },
              style: {
                stroke: '#F44336',
                strokeWidth: isSelected ? 4 : 3,
                strokeDasharray: '5,5',
                opacity: isHidden ? 0.1 : 1,
              },
            });

            processedEdges.add(edgeId);
            processedEdges.add(reverseEdgeId);
          } else {
            // 단방향인 경우 기존 로직
            if (processedEdges.has(edgeId)) {
              return;
            }

            initialEdges.push({
              id: edgeId,
              source: task.id,
              target: successorId,
              type: ConnectionLineType.SmoothStep,
              animated: highlightedTasks.has(task.id) || highlightedTasks.has(successorId),
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: colors.border,
              },
              style: {
                stroke: colors.border,
                strokeWidth: isSelected ? 4 : 2,
                opacity: isHidden ? 0.1 : 1,
              },
            });

            processedEdges.add(edgeId);
          }
        }
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges, levels } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    // 가장 왼쪽 노드들 찾기 (최대 레벨을 가진 노드들)
    const maxLevel = Math.max(...Array.from(levels.values()));
    const startNodeIds = new Set<string>();
    initialNodes.forEach(node => {
      if (levels.get(node.id) === maxLevel) {
        startNodeIds.add(node.id);
      }
    });

    // 전체 L5 태스크의 누적 MM 계산
    const totalMM = tasks.reduce((sum, task) => sum + task.MM, 0);

    // 노드에 하이라이팅 및 시작 노드 플래그 추가
    const finalNodes = layoutedNodes.map(node => {
      // 선택된 엣지와 연결된 노드인지 확인
      let isHighlighted = node.data.isHighlighted;
      if (selectedEdge) {
        const edge = layoutedEdges.find(e => e.id === selectedEdge);
        if (edge && (edge.source === node.id || edge.target === node.id)) {
          isHighlighted = true;
        }
      }

      const isStartNode = startNodeIds.has(node.id);

      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted,
          isStartNode,
          cumulativeMM: isStartNode ? totalMM : node.data.cumulativeMM,
        },
        style: selectedEdge && !isHighlighted ? { opacity: 0.3 } : undefined,
      };
    });

    setNodes(finalNodes as any);
    setEdges(layoutedEdges as any);
  }, [processedData, viewMode, selectedL5, highlightedTasks, visibleL4Categories, getFilteredL5Tasks, setNodes, setEdges, selectedEdge]);

  // 노드 클릭 핸들러
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (viewMode === 'l5-all') {
        // 첫 번째 클릭: 필터링 모드로 전환
        setSelectedL5(node.id);
        setViewMode('l5-filtered');
      } else if (viewMode === 'l5-filtered' && selectedL5 === node.id) {
        // 두 번째 클릭: L6 상세 뷰로 전환
        setViewMode('l6-detail');
      }
    },
    [viewMode, selectedL5, setSelectedL5, setViewMode]
  );

  // 엣지 클릭 핸들러
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge.id === selectedEdge ? null : edge.id);
  }, [selectedEdge]);

  // 백그라운드 클릭: 전체 뷰로 복귀 또는 선택 해제
  const onPaneClick = useCallback(() => {
    if (selectedEdge) {
      // 엣지 선택 해제
      setSelectedEdge(null);
    } else if (viewMode === 'l5-filtered') {
      // 전체 뷰로 복귀
      setViewMode('l5-all');
      setSelectedL5(null);
    }
  }, [viewMode, setViewMode, setSelectedL5, selectedEdge]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* L4 카테고리 레전드 */}
      <L4CategoryLegend className="absolute top-4 left-4 z-10 w-64" />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <Background />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            return getColorForCategory(data.category).border;
          }}
        />
      </ReactFlow>
    </div>
  );
}
