'use client';

import { useCallback, useEffect, useMemo } from 'react';
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
};

// 간단한 계층적 레이아웃 (최종 노드가 왼쪽)
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
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

  return { nodes: layoutedNodes, edges };
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

  // 노드와 엣지 생성
  useEffect(() => {
    if (!processedData) return;

    const tasks = getFilteredL5Tasks();

    const initialNodes: Node<TaskNodeData>[] = tasks.map((task) => ({
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
    tasks.forEach((task) => {
      task.successors.forEach((successorId) => {
        if (tasks.some((t) => t.id === successorId)) {
          const colors = getColorForCategory(task.l4Category);
          initialEdges.push({
            id: `${task.id}-${successorId}`,
            source: task.id,
            target: successorId,
            type: ConnectionLineType.SmoothStep,
            animated: highlightedTasks.has(task.id) || highlightedTasks.has(successorId),
            style: {
              stroke: task.hasCycle ? '#F44336' : colors.border,
              strokeWidth: 2,
            },
          });
        }
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [processedData, viewMode, selectedL5, highlightedTasks, visibleL4Categories, getFilteredL5Tasks, setNodes, setEdges]);

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

  // 백그라운드 클릭: 전체 뷰로 복귀
  const onPaneClick = useCallback(() => {
    if (viewMode === 'l5-filtered') {
      setViewMode('l5-all');
      setSelectedL5(null);
    }
  }, [viewMode, setViewMode, setSelectedL5]);

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
            const data = node.data as TaskNodeData;
            return getColorForCategory(data.category).border;
          }}
        />
      </ReactFlow>
    </div>
  );
}
