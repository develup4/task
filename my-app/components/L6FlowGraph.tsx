'use client';

import { useCallback, useEffect } from 'react';
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
import { getColorForCategory } from '@/utils/colors';

const nodeTypes = {
  task: TaskNode,
} as any;

// 간단한 계층적 레이아웃
const getLayoutedElements = (nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } => {
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  const calculateLevel = (nodeId: string): number => {
    if (levels.has(nodeId)) return levels.get(nodeId)!;
    if (visited.has(nodeId)) return 0;

    visited.add(nodeId);

    const incomingEdges = edges.filter(e => e.target === nodeId);

    if (incomingEdges.length === 0) {
      levels.set(nodeId, 0);
      return 0;
    }

    const maxSuccessorLevel = Math.max(
      ...incomingEdges.map(e => calculateLevel(e.source))
    );
    const level = maxSuccessorLevel + 1;
    levels.set(nodeId, level);
    return level;
  };

  nodes.forEach(node => calculateLevel(node.id));

  const levelGroups = new Map<number, Node[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  const nodeWidth = 220;
  const nodeHeight = 100;
  const horizontalSpacing = 180;
  const verticalSpacing = 100;

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

export default function L6FlowGraph() {
  const {
    processedData,
    selectedL5,
    getL6TasksForL5,
  } = useAppStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 노드와 엣지 생성
  useEffect(() => {
    if (!processedData || !selectedL5) return;

    const l6Tasks = getL6TasksForL5(selectedL5);
    const l5Task = processedData.l5Tasks.get(selectedL5);

    if (!l5Task) return;

    // L6 노드들
    const l6Nodes = l6Tasks.map((task) => ({
      id: task.id,
      type: 'task',
      position: { x: 0, y: 0 },
      data: {
        label: task.name,
        category: task.l4Category,
        필요인력: task.필요인력,
        필요기간: task.필요기간,
        MM: task.MM,
        hasCycle: task.hasCycle,
        isHighlighted: false,
        isSelected: false,
      },
    }));

    // L6 간의 엣지
    const l6Edges: Edge[] = [];
    const processedL6Edges = new Set<string>();

    l6Tasks.forEach((task) => {
      task.successors.forEach((successorId) => {
        if (l6Tasks.some((t) => t.id === successorId)) {
          const edgeId = `${task.id}-${successorId}`;
          const reverseEdgeId = `${successorId}-${task.id}`;

          // 이미 처리한 엣지는 건너뛰기
          if (processedL6Edges.has(reverseEdgeId)) {
            return;
          }

          const colors = getColorForCategory(task.l4Category);
          const successor = l6Tasks.find(t => t.id === successorId);

          // 양방향 연결 체크 (cycle error)
          const isBidirectional = successor && successor.successors.includes(task.id);

          l6Edges.push({
            id: edgeId,
            source: task.id,
            target: successorId,
            type: ConnectionLineType.SmoothStep,
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20,
              color: isBidirectional ? '#F44336' : colors.border,
            },
            style: {
              stroke: isBidirectional ? '#F44336' : colors.border,
              strokeWidth: isBidirectional ? 3 : 2,
              strokeDasharray: isBidirectional ? '5,5' : undefined,
            },
            label: isBidirectional ? '⚠ 양방향' : undefined,
            labelStyle: isBidirectional ? { fill: '#F44336', fontWeight: 'bold' } : undefined,
            labelBgStyle: isBidirectional ? { fill: '#FFEBEE' } : undefined,
          });

          processedL6Edges.add(edgeId);
        }
      });
    });

    // 선행/후행 L5 노드들 (회색으로 표시)
    const relatedL5Ids = new Set<string>();
    l6Tasks.forEach((task) => {
      task['선행 L5']?.forEach((l5Id) => relatedL5Ids.add(l5Id));
      task['후행 L5']?.forEach((l5Id) => relatedL5Ids.add(l5Id));
    });

    const relatedL5Nodes = Array.from(relatedL5Ids)
      .map((l5Id) => {
        const task = processedData.l5Tasks.get(l5Id);
        if (!task) return null;
        return {
          id: `l5-${l5Id}`,
          type: 'task',
          position: { x: 0, y: 0 },
          data: {
            label: `[L5] ${task.name}`,
            category: task.l4Category,
            필요인력: task.필요인력,
            필요기간: task.필요기간,
            MM: task.MM,
            hasCycle: false,
            isHighlighted: false,
            isSelected: false,
          },
          style: {
            opacity: 0.6,
          },
        };
      })
      .filter((node): node is any => node !== null);

    // L5와 L6 간의 엣지
    const l5ToL6Edges: Edge[] = [];
    l6Tasks.forEach((l6Task) => {
      // 선행 L5
      l6Task['선행 L5']?.forEach((l5Id) => {
        l5ToL6Edges.push({
          id: `l5-${l5Id}-${l6Task.id}`,
          source: `l5-${l5Id}`,
          target: l6Task.id,
          type: ConnectionLineType.SmoothStep,
          markerEnd: {
            type: 'arrowclosed',
            width: 15,
            height: 15,
            color: '#9E9E9E',
          },
          style: {
            stroke: '#9E9E9E',
            strokeWidth: 1,
            strokeDasharray: '5,5',
          },
        });
      });

      // 후행 L5
      l6Task['후행 L5']?.forEach((l5Id) => {
        l5ToL6Edges.push({
          id: `${l6Task.id}-l5-${l5Id}`,
          source: l6Task.id,
          target: `l5-${l5Id}`,
          type: ConnectionLineType.SmoothStep,
          markerEnd: {
            type: 'arrowclosed',
            width: 15,
            height: 15,
            color: '#9E9E9E',
          },
          style: {
            stroke: '#9E9E9E',
            strokeWidth: 1,
            strokeDasharray: '5,5',
          },
        });
      });
    });

    const allNodes = [...l6Nodes, ...relatedL5Nodes];
    const allEdges = [...l6Edges, ...l5ToL6Edges];

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      allNodes,
      allEdges
    );

    setNodes(layoutedNodes as any);
    setEdges(layoutedEdges as any);
  }, [processedData, selectedL5, getL6TasksForL5, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
