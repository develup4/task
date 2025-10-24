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
  useReactFlow,
  ReactFlowProvider,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/lib/store';
import TaskNode, { TaskNodeData } from './TaskNode';
import { getColorForCategory } from '@/utils/colors';
import { calculateCriticalPath } from '@/utils/criticalPath';

// 커스텀 엣지 컴포넌트 - offset을 적용한 Bezier 곡선
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
  labelStyle,
  labelBgStyle,
}: EdgeProps) {
  const offset = (typeof data?.offset === 'number' ? data.offset : 0);

  // offset을 y 좌표에 적용
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY: sourceY + offset,
    sourcePosition,
    targetX,
    targetY: targetY + offset,
    targetPosition,
    curvature: 0.5, // 곡률을 높여서 더 부드러운 곡선
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-30}
            y={-10}
            width={60}
            height={20}
            fill={labelBgStyle?.fill || 'white'}
            rx={3}
          />
          <text
            style={labelStyle}
            x={0}
            y={5}
            textAnchor="middle"
            className="react-flow__edge-text"
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
}

const nodeTypes = {
  task: TaskNode,
} as any;

const edgeTypes = {
  default: CustomEdge,
} as any;

// 컴팩트한 계층적 레이아웃
const getLayoutedElements = (nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[], levels: Map<string, number> } => {
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  // 각 노드의 입/출력 차수 계산
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  nodes.forEach(node => {
    inDegree.set(node.id, edges.filter(e => e.target === node.id).length);
    outDegree.set(node.id, edges.filter(e => e.source === node.id).length);
  });

  // 중요 노드 판별: 여러 입력/출력을 가진 노드 (분기점/합류점)
  const isImportantNode = (nodeId: string): boolean => {
    const inDeg = inDegree.get(nodeId) || 0;
    const outDeg = outDegree.get(nodeId) || 0;
    return inDeg >= 2 || outDeg >= 2 || outDeg === 0;
  };

  const calculateLevel = (nodeId: string): number => {
    if (levels.has(nodeId)) return levels.get(nodeId)!;
    if (visited.has(nodeId)) return 0;

    visited.add(nodeId);

    const outgoingEdges = edges.filter(e => e.source === nodeId);

    if (outgoingEdges.length === 0) {
      // 끝 노드는 level 0 (왼쪽, 최종 도착지)
      levels.set(nodeId, 0);
      return 0;
    }

    const successorLevels = outgoingEdges.map(e => calculateLevel(e.target));
    const maxSuccessorLevel = Math.max(...successorLevels);

    // L6는 가로로 길게 펼쳐서 흐름이 보이도록 - 모든 노드가 새로운 레벨
    const level = maxSuccessorLevel + 1;

    levels.set(nodeId, level);
    return level;
  };

  nodes.forEach(node => calculateLevel(node.id));

  // 레벨 번호 정규화 (빈 레벨 제거하고 연속적으로 만들기)
  const usedLevels = new Set<number>();
  nodes.forEach(node => {
    usedLevels.add(levels.get(node.id) || 0);
  });

  // 사용된 레벨을 오름차순 정렬
  const sortedLevels = Array.from(usedLevels).sort((a, b) => a - b);

  // 레벨 매핑 생성 (기존 레벨 → 새 레벨)
  const levelMapping = new Map<number, number>();
  sortedLevels.forEach((oldLevel, index) => {
    levelMapping.set(oldLevel, index);
  });

  // 모든 노드의 레벨을 새 번호로 업데이트
  nodes.forEach(node => {
    const oldLevel = levels.get(node.id) || 0;
    const newLevel = levelMapping.get(oldLevel) || 0;
    levels.set(node.id, newLevel);
  });

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
        // level 0이 왼쪽에 오도록 배치
        x: level * (nodeWidth + horizontalSpacing),
        y: indexInLevel * (nodeHeight + verticalSpacing),
      },
    };
  });

  return { nodes: layoutedNodes, edges, levels };
};

interface L6FlowGraphInnerProps {
  onNavigateToErrorReport?: () => void;
  showCriticalPath: boolean;
}

function L6FlowGraphInner({ onNavigateToErrorReport, showCriticalPath }: L6FlowGraphInnerProps) {
  const {
    processedData,
    selectedL5,
    getL6TasksForL5,
    setViewMode,
  } = useAppStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [criticalPathIds, setCriticalPathIds] = useState<Set<string>>(new Set());
  const { fitView, setCenter } = useReactFlow();

  // 크리티컬 패스 계산
  useEffect(() => {
    if (!processedData || !selectedL5) return;

    const l6Tasks = getL6TasksForL5(selectedL5);
    const criticalPath = calculateCriticalPath(l6Tasks);

    setCriticalPathIds(new Set(criticalPath.path));
  }, [processedData, selectedL5, getL6TasksForL5]);

  // 노드와 엣지 생성
  useEffect(() => {
    if (!processedData || !selectedL5) return;

    const l6Tasks = getL6TasksForL5(selectedL5);
    const l5Task = processedData.l5Tasks.get(selectedL5);

    if (!l5Task) return;

    // L6 간의 엣지 먼저 생성 (기본 정보만)
    const l6EdgesBase: Array<{
      id: string;
      source: string;
      target: string;
      isBidirectional: boolean;
      category: string;
    }> = [];
    const processedL6Edges = new Set<string>();

    l6Tasks.forEach((task) => {
      task.successors.forEach((successorId) => {
        if (l6Tasks.some((t) => t.id === successorId)) {
          const edgeId = `${task.id}-${successorId}`;
          const reverseEdgeId = `${successorId}-${task.id}`;

          const successor = l6Tasks.find(t => t.id === successorId);

          // 양방향 연결 체크 (cycle error)
          const isBidirectional = successor && successor.successors.includes(task.id);

          // 양방향인 경우 양쪽 엣지 모두 추가
          if (isBidirectional) {
            // 이미 처리한 엣지는 건너뛰기
            if (processedL6Edges.has(edgeId) || processedL6Edges.has(reverseEdgeId)) {
              return;
            }

            // 정방향 엣지
            l6EdgesBase.push({
              id: edgeId,
              source: task.id,
              target: successorId,
              isBidirectional: true,
              category: task.l4Category,
            });

            // 역방향 엣지
            l6EdgesBase.push({
              id: reverseEdgeId,
              source: successorId,
              target: task.id,
              isBidirectional: true,
              category: task.l4Category,
            });

            processedL6Edges.add(edgeId);
            processedL6Edges.add(reverseEdgeId);
          } else {
            // 단방향인 경우 기존 로직
            if (processedL6Edges.has(edgeId)) {
              return;
            }

            l6EdgesBase.push({
              id: edgeId,
              source: task.id,
              target: successorId,
              isBidirectional: false,
              category: task.l4Category,
            });

            processedL6Edges.add(edgeId);
          }
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

        // L5 Task가 없으면 Unspecified로 생성
        if (!task) {
          return {
            id: `l5-${l5Id}`,
            type: 'task',
            position: { x: 0, y: 0 },
            data: {
              label: `[L5] ${l5Id}`,
              category: 'Unspecified',
              필요인력: 0,
              필요기간: 0,
              MM: 0,
              hasCycle: false,
              isHighlighted: false,
              isSelected: false,
            },
            style: {
              opacity: 0.6,
            },
          };
        }

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
      });

    // L5와 L6 간의 엣지 (기본 정보만)
    const l5ToL6EdgesBase: Array<{
      id: string;
      source: string;
      target: string;
    }> = [];
    l6Tasks.forEach((l6Task) => {
      // 선행 L5
      l6Task['선행 L5']?.forEach((l5Id) => {
        l5ToL6EdgesBase.push({
          id: `l5-${l5Id}-${l6Task.id}`,
          source: `l5-${l5Id}`,
          target: l6Task.id,
        });
      });

      // 후행 L5
      l6Task['후행 L5']?.forEach((l5Id) => {
        l5ToL6EdgesBase.push({
          id: `${l6Task.id}-l5-${l5Id}`,
          source: l6Task.id,
          target: `l5-${l5Id}`,
        });
      });
    });

    // L6 엣지를 ReactFlow Edge로 변환 (선택 상태 반영)
    const l6Edges: Edge[] = l6EdgesBase.map((edge, index) => {
      const colors = getColorForCategory(edge.category);
      const reverseEdgeId = `${edge.target}-${edge.source}`;
      const isSelected = selectedEdge === edge.id || selectedEdge === reverseEdgeId;
      const isHidden = selectedEdge !== null && !isSelected;

      // 크리티컬 패스에 속하는 엣지인지 확인
      const isInCriticalPath = showCriticalPath &&
        criticalPathIds.has(edge.source) &&
        criticalPathIds.has(edge.target);

      // 양방향인 경우 첫 번째 엣지에만 라벨 표시
      const isFirstOfBidirectional = edge.isBidirectional &&
        l6EdgesBase.findIndex(e =>
          (e.source === edge.source && e.target === edge.target) ||
          (e.source === edge.target && e.target === edge.source)
        ) === index;

      // 양방향 엣지의 경우 offset 적용
      const offset = edge.isBidirectional ? (edge.source < edge.target ? 15 : -15) : 0;

      // 크리티컬 패스 색상
      const criticalPathColor = '#f59e0b';
      const strokeColor = isInCriticalPath
        ? criticalPathColor
        : edge.isBidirectional
        ? 'rgba(244, 67, 54, 0.5)'
        : colors.border;

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        markerEnd: {
          type: 'arrowclosed',
          width: isInCriticalPath ? 18 : 16,
          height: isInCriticalPath ? 18 : 16,
          color: strokeColor,
        },
        style: {
          stroke: strokeColor,
          strokeWidth: isInCriticalPath ? 3.5 : (isSelected ? 3 : 1.5),
          strokeDasharray: isInCriticalPath ? undefined : '8,4',
          opacity: isHidden ? 0.1 : (isInCriticalPath ? 1 : (edge.isBidirectional ? 1 : 0.6)),
          cursor: 'pointer',
        },
        interactionWidth: 20,
        data: { offset },
        label: edge.isBidirectional && isFirstOfBidirectional ? '⚠ 양방향' : undefined,
        labelStyle: edge.isBidirectional ? { fill: '#F44336', fontWeight: 'bold', fontSize: '11px' } : undefined,
        labelBgStyle: edge.isBidirectional ? { fill: '#FFEBEE' } : undefined,
      };
    });

    // L5-L6 엣지를 ReactFlow Edge로 변환 (선택 상태 반영)
    const l5ToL6Edges: Edge[] = l5ToL6EdgesBase.map((edge) => {
      const isSelected = selectedEdge === edge.id;
      const isHidden = selectedEdge !== null && !isSelected;

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        markerEnd: {
          type: 'arrowclosed',
          width: 12,
          height: 12,
          color: 'rgba(158, 158, 158, 0.5)',
        },
        style: {
          stroke: 'rgba(158, 158, 158, 0.5)',
          strokeWidth: isSelected ? 2 : 1,
          strokeDasharray: '8,4',
          opacity: isHidden ? 0.05 : 0.6,
          cursor: 'pointer',
        },
        interactionWidth: 20,
      };
    });

    const allEdges = [...l6Edges, ...l5ToL6Edges];

    // 에러가 있는 노드들 찾기
    const nodeErrors = new Map<string, number[]>();
    processedData.errors.forEach((error, index) => {
      if (error.sourceLevel === 'L6') {
        if (!nodeErrors.has(error.sourceTask)) {
          nodeErrors.set(error.sourceTask, []);
        }
        nodeErrors.get(error.sourceTask)!.push(index);
      }
    });

    const l6Nodes = l6Tasks.map((task) => {
      const hasError = nodeErrors.has(task.id);
      // 선택된 엣지와 연결된 노드인지 확인
      let isHighlighted = false;
      if (selectedEdge) {
        const edge = allEdges.find(e => e.id === selectedEdge);
        if (edge && (edge.source === task.id || edge.target === task.id)) {
          isHighlighted = true;
        }
      }

      // 크리티컬 패스에 속하는지 확인
      const isInCriticalPath = showCriticalPath && criticalPathIds.has(task.id);

      return {
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
          isHighlighted,
          isSelected: false,
          fullData: task,
          isL5: false,
          isL6: true,
          hasError,
          onErrorClick: () => {
            // 에러 리포트 탭으로 이동
            onNavigateToErrorReport?.();
            // 약간의 딜레이 후 에러 행으로 스크롤
            setTimeout(() => {
              const errorIndex = nodeErrors.get(task.id)?.[0];
              if (errorIndex !== undefined) {
                const errorRow = document.getElementById(`error-row-${task.id}-${errorIndex}`);
                if (errorRow) {
                  errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }, 100);
          },
        },
        style: selectedEdge && !isHighlighted
          ? { opacity: 0.3 }
          : isInCriticalPath
          ? {
              border: '3px solid #f59e0b',
              borderRadius: '8px',
              boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.3)',
            }
          : undefined,
      };
    });

    // L5 노드도 하이라이팅 적용
    const updatedRelatedL5Nodes = relatedL5Nodes.map((node) => {
      let isHighlighted = false;
      if (selectedEdge) {
        const edge = allEdges.find(e => e.id === selectedEdge);
        if (edge && (edge.source === node.id || edge.target === node.id)) {
          isHighlighted = true;
        }
      }

      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted,
        },
        style: {
          ...node.style,
          opacity: selectedEdge && !isHighlighted ? 0.2 : 0.6,
        },
      };
    });

    const allNodes = [...l6Nodes, ...updatedRelatedL5Nodes];

    const { nodes: layoutedNodes, edges: layoutedEdges, levels } = getLayoutedElements(
      allNodes,
      allEdges
    );

    setNodes(layoutedNodes as any);
    setEdges(layoutedEdges as any);
  }, [processedData, selectedL5, getL6TasksForL5, setNodes, setEdges, selectedEdge, showCriticalPath, criticalPathIds, onNavigateToErrorReport]);

  // L6 진입 시 전체 그래프가 보이도록 fitView
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [nodes.length, fitView]);

  // 엣지 클릭 핸들러
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge.id === selectedEdge ? null : edge.id);

    // 엣지 선택 시 뷰포트를 엣지 중앙으로 이동
    if (edge.id !== selectedEdge) {
      const sourceNode = (nodes as Node[]).find(n => n.id === edge.source);
      const targetNode = (nodes as Node[]).find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
        const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
        setCenter(centerX, centerY, { zoom: 1, duration: 500 });
      }
    }
  }, [selectedEdge, nodes, setCenter]);

  // 패널 클릭 시 L5-filtered 모드로 복귀
  const onPaneClick = useCallback(() => {
    if (selectedEdge) {
      // 엣지가 선택되어 있으면 선택 해제만
      setSelectedEdge(null);
    } else {
      // 엣지가 선택되어 있지 않으면 L5-filtered로 복귀
      setViewMode('l5-filtered');
    }
  }, [selectedEdge, setViewMode]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.1}
        maxZoom={2}
        edgesFocusable={true}
        elementsSelectable={true}
      >
        <Controls className="sky-controls" />
        <Background />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            return getColorForCategory(data.category).border;
          }}
          maskColor="rgba(14, 165, 233, 0.1)"
          style={{
            backgroundColor: '#f8fafc',
            border: '2px solid #e0f2fe',
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

interface L6FlowGraphProps {
  onNavigateToErrorReport?: () => void;
  showCriticalPath: boolean;
}

export default function L6FlowGraph({ onNavigateToErrorReport, showCriticalPath }: L6FlowGraphProps) {
  return (
    <ReactFlowProvider>
      <L6FlowGraphInner
        onNavigateToErrorReport={onNavigateToErrorReport}
        showCriticalPath={showCriticalPath}
      />
    </ReactFlowProvider>
  );
}
