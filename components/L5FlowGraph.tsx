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
import L4CategoryLegend from './L4CategoryLegend';
import { getColorForCategory } from '@/utils/colors';

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
  const offset = data?.offset || 0;

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

// 간단한 계층적 레이아웃 (최종 노드가 왼쪽)
const getLayoutedElements = (nodes: Node[], edges: Edge[], isFilteredMode: boolean = false): { nodes: Node[], edges: Edge[], levels: Map<string, number> } => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const levels = new Map<string, number>();
  const visiting = new Set<string>();
  const visited = new Set<string>();

  // 각 노드의 레벨 계산 (후행 노드 기준)
  const calculateLevel = (nodeId: string, depth: number = 0): number => {
    if (levels.has(nodeId)) return levels.get(nodeId)!;

    // 순환 참조 감지 - 현재 경로에서 다시 방문하는 경우
    if (visiting.has(nodeId)) {
      // 순환 참조가 있는 노드는 깊이를 기반으로 임시 레벨 할당
      return depth;
    }

    if (visited.has(nodeId)) return levels.get(nodeId) || 0;

    visiting.add(nodeId);

    // 나가는 엣지 (후행 작업)을 기준으로 레벨 계산
    const outgoingEdges = edges.filter(e => e.source === nodeId);

    let level = 0;

    // 후행 작업이 없으면 level 0 (최후단)
    if (outgoingEdges.length === 0) {
      level = 0;
    } else {
      // 후행 노드들의 최대 레벨 + 1
      const successorLevels = outgoingEdges.map(e => calculateLevel(e.target, depth + 1));
      level = Math.max(...successorLevels, 0) + 1;
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    levels.set(nodeId, level);
    return level;
  };

  // 모든 노드의 레벨 계산
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      calculateLevel(node.id, 0);
    }
  });

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

  // L5-filtered 모드일 때 같은 레벨의 노드들 간 연결을 고려하여 위치 조정
  if (isFilteredMode) {
    levelGroups.forEach((nodesInLevel, level) => {
      if (nodesInLevel.length <= 1) return;

      // 같은 레벨 내에서 연결 관계 파악
      const nodeConnections = new Map<string, Set<string>>();
      nodesInLevel.forEach(node => {
        const targets = new Set<string>();
        edges.forEach(edge => {
          if (edge.source === node.id && nodesInLevel.some(n => n.id === edge.target)) {
            targets.add(edge.target);
          }
        });
        nodeConnections.set(node.id, targets);
      });

      // 연결이 많은 노드를 먼저 배치 (토폴로지 정렬 스타일)
      const sorted = [...nodesInLevel].sort((a, b) => {
        const aTargets = nodeConnections.get(a.id)?.size || 0;
        const bTargets = nodeConnections.get(b.id)?.size || 0;
        return bTargets - aTargets; // 연결이 많은 것부터
      });

      levelGroups.set(level, sorted);
    });
  }

  const layoutedNodes = nodes.map(node => {
    const level = levels.get(node.id) || 0;
    const nodesInLevel = levelGroups.get(level) || [];
    const indexInLevel = nodesInLevel.indexOf(node);

    // L5-filtered 모드에서는 y 위치에 약간의 offset 추가
    let yOffset = 0;
    if (isFilteredMode && nodesInLevel.length > 1) {
      // 인덱스에 따라 y 위치를 약간씩 조정 (지그재그 효과)
      yOffset = (indexInLevel % 2) * 60;
    }

    return {
      ...node,
      position: {
        // level 0이 왼쪽에 오도록 배치
        x: level * (nodeWidth + horizontalSpacing),
        y: indexInLevel * (nodeHeight + verticalSpacing) + yOffset,
      },
    };
  });

  return { nodes: layoutedNodes, edges, levels };
};

interface L5FlowGraphInnerProps {
  searchQuery: string;
  searchTrigger: number;
  onSearchResultsChange?: (count: number, index: number) => void;
}

function L5FlowGraphInner({ searchQuery, searchTrigger, onSearchResultsChange }: L5FlowGraphInnerProps) {
  const {
    processedData,
    viewMode,
    selectedL5,
    highlightedTasks,
    visibleL4Categories,
    visibleTeams,
    setSelectedL5,
    setViewMode,
    getFilteredL5Tasks,
  } = useAppStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchedNodeId, setSearchedNodeId] = useState<string | null>(null);
  const [returnTarget, setReturnTarget] = useState<string | null>(null);
  const [returnZoom, setReturnZoom] = useState<number | null>(null);
  const [shouldFitView, setShouldFitView] = useState(true);
  const { setCenter, fitView, getZoom } = useReactFlow();

  // 노드와 엣지 생성
  useEffect(() => {
    if (!processedData) return;

    const tasks = getFilteredL5Tasks();

    // 초기 로드 시에만 fitView 활성화
    if (viewMode === 'l5-all' && !returnTarget) {
      setShouldFitView(true);
    }

    // 에러가 있는 노드들 찾기
    const nodeErrors = new Map<string, number[]>();
    processedData.errors.forEach((error, index) => {
      if (error.sourceLevel === 'L5') {
        if (!nodeErrors.has(error.sourceTask)) {
          nodeErrors.set(error.sourceTask, []);
        }
        nodeErrors.get(error.sourceTask)!.push(index);
      }
    });

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
        fullData: task,
        isL5: true,
        isL6: false,
        hasError: nodeErrors.has(task.id),
        onErrorClick: () => {
          // 첫 번째 에러로 스크롤
          const errorIndex = nodeErrors.get(task.id)?.[0];
          if (errorIndex !== undefined) {
            const errorRow = document.getElementById(`error-row-${task.id}-${errorIndex}`);
            if (errorRow) {
              errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        },
      },
    }));

    const initialEdges: Edge[] = [];
    const processedEdges = new Set<string>();

    tasks.forEach((task) => {
      task.successors.forEach((successorId) => {
        // Self-loop 방지: 자기 자신을 successor로 가지는 경우 스킵
        if (task.id === successorId) {
          return;
        }

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

            // 정방향 엣지 (위쪽으로 offset)
            initialEdges.push({
              id: edgeId,
              source: task.id,
              target: successorId,
              type: 'default',
              animated: highlightedTasks.has(task.id) || highlightedTasks.has(successorId),
              markerEnd: {
                type: 'arrowclosed',
                width: 16,
                height: 16,
                color: 'rgba(244, 67, 54, 0.5)',
              },
              style: {
                stroke: 'rgba(244, 67, 54, 0.5)',
                strokeWidth: isSelected ? 3 : 1.5,
                strokeDasharray: '8,4',
                opacity: isHidden ? 0.1 : 1,
              },
              data: { offset: 15 }, // 위쪽으로 offset
              label: '⚠ 양방향',
              labelStyle: { fill: '#F44336', fontWeight: 'bold', fontSize: '11px' },
              labelBgStyle: { fill: '#FFEBEE' },
            });

            // 역방향 엣지 (아래쪽으로 offset)
            initialEdges.push({
              id: reverseEdgeId,
              source: successorId,
              target: task.id,
              type: 'default',
              animated: highlightedTasks.has(task.id) || highlightedTasks.has(successorId),
              markerEnd: {
                type: 'arrowclosed',
                width: 16,
                height: 16,
                color: 'rgba(244, 67, 54, 0.5)',
              },
              style: {
                stroke: 'rgba(244, 67, 54, 0.5)',
                strokeWidth: isSelected ? 3 : 1.5,
                strokeDasharray: '8,4',
                opacity: isHidden ? 0.1 : 1,
              },
              data: { offset: -15 }, // 아래쪽으로 offset
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
              type: 'default',
              animated: highlightedTasks.has(task.id) || highlightedTasks.has(successorId),
              markerEnd: {
                type: 'arrowclosed',
                width: 16,
                height: 16,
                color: colors.border,
              },
              style: {
                stroke: colors.border,
                strokeWidth: isSelected ? 3 : 1.5,
                opacity: isHidden ? 0.1 : 0.6,
              },
            });

            processedEdges.add(edgeId);
          }
        }
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges, levels } = getLayoutedElements(
      initialNodes,
      initialEdges,
      viewMode === 'l5-filtered'
    );

    // 가장 왼쪽 노드들 찾기 (레벨 0 노드들 = 최후단 작업)
    const startNodeIds = new Set<string>();
    initialNodes.forEach(node => {
      if (levels.get(node.id) === 0) {
        startNodeIds.add(node.id);
      }
    });

    // 각 노드의 누적 MM 계산 (해당 노드부터 시작점까지의 모든 경로 중 최대값)
    const cumulativeMMs = new Map<string, number>();
    const calculateCumulativeMM = (nodeId: string, visited = new Set<string>()): number => {
      // 이미 계산된 경우
      if (cumulativeMMs.has(nodeId)) {
        return cumulativeMMs.get(nodeId)!;
      }

      // 순환 참조 방지
      if (visited.has(nodeId)) {
        return 0;
      }

      const node = initialNodes.find(n => n.id === nodeId);
      if (!node) return 0;

      const newVisited = new Set(visited);
      newVisited.add(nodeId);

      // 이 노드로 들어오는 엣지들 (선행 작업들)
      const incomingEdges = initialEdges.filter(e => e.target === nodeId);

      let maxPredecessorMM = 0;
      if (incomingEdges.length > 0) {
        // 선행 작업들 중 최대 누적 MM
        maxPredecessorMM = Math.max(
          ...incomingEdges.map(e => calculateCumulativeMM(e.source, newVisited))
        );
      }

      // 현재 노드의 MM + 선행 작업의 최대 누적 MM
      const cumulativeMM = node.data.MM + maxPredecessorMM;
      cumulativeMMs.set(nodeId, cumulativeMM);

      return cumulativeMM;
    };

    // 모든 노드의 누적 MM 계산
    initialNodes.forEach(node => {
      calculateCumulativeMM(node.id);
    });

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
      const cumulativeMM = cumulativeMMs.get(node.id) || node.data.MM;
      // Only set isSearched in l5-all mode
      const isSearched = viewMode === 'l5-all' && searchedNodeId === node.id;

      // l5-filtered 모드에서는 가장 왼쪽 말단 노드(level 0)는 하이라이트 및 누적 MM 표시 안 함
      const shouldShowHighlight = viewMode === 'l5-filtered' ? !isStartNode : isHighlighted;
      const shouldShowCumulativeMM = viewMode === 'l5-filtered' ? !isStartNode : true;

      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: shouldShowHighlight && isHighlighted,
          isStartNode: shouldShowCumulativeMM ? isStartNode : false,
          cumulativeMM: shouldShowCumulativeMM ? cumulativeMM : node.data.MM,
          isSearched,
        },
        style: selectedEdge && !isHighlighted && !isSearched ? { opacity: 0.3 } : undefined,
      };
    });

    setNodes(finalNodes as any);
    setEdges(layoutedEdges as any);
  }, [processedData, viewMode, selectedL5, highlightedTasks, visibleL4Categories, visibleTeams, getFilteredL5Tasks, setNodes, setEdges, selectedEdge, searchedNodeId]);

  // L5-filtered 모드 진입 시 선택된 노드를 화면 중앙으로 이동
  useEffect(() => {
    if (viewMode === 'l5-filtered' && selectedL5 && nodes.length > 0) {
      const selectedNode = (nodes as Node[]).find(n => n.id === selectedL5);
      if (selectedNode) {
        // 약간의 딜레이를 주어 레이아웃이 완료된 후 중앙 이동
        setTimeout(() => {
          setCenter(
            selectedNode.position.x + 110, // 노드 너비의 절반 (220/2)
            selectedNode.position.y + 50,  // 노드 높이의 절반 (100/2)
            { zoom: 1, duration: 800 }      // 부드러운 애니메이션
          );
        }, 100);
      }
    }
  }, [viewMode, selectedL5, nodes, setCenter]);

  // L5-filtered 또는 L6 진입 시 복귀 대상 노드 및 줌 레벨 저장
  useEffect(() => {
    if ((viewMode === 'l5-filtered' || viewMode === 'l6-detail') && selectedL5) {
      setReturnTarget(selectedL5);
      // 현재 줌 레벨 저장
      const currentZoom = getZoom();
      setReturnZoom(currentZoom);
    }
  }, [viewMode, selectedL5, getZoom]);

  // L5-all로 복귀 시 이전에 선택된 노드로 뷰포트 이동 (줌 레벨 유지)
  useEffect(() => {
    if (viewMode === 'l5-all' && returnTarget && nodes.length > 0) {
      // fitView 비활성화
      setShouldFitView(false);

      const targetNode = (nodes as Node[]).find(n => n.id === returnTarget);
      if (targetNode) {
        setTimeout(() => {
          // 저장된 줌 레벨 사용 (없으면 기본값 1)
          const zoomLevel = returnZoom ?? 1;
          setCenter(
            targetNode.position.x + 110,
            targetNode.position.y + 50,
            { zoom: zoomLevel, duration: 800 }
          );
          // 복귀 완료 후 타겟 및 줌 초기화
          setReturnTarget(null);
          setReturnZoom(null);
        }, 100);
      } else {
        // 타겟 노드를 찾지 못한 경우에도 초기화
        setReturnTarget(null);
        setReturnZoom(null);
      }
    }
  }, [viewMode, returnTarget, returnZoom, nodes, setCenter]);

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
    } else if (viewMode === 'l5-filtered' && selectedL5) {
      // 선택된 노드로 뷰포트 이동 후 전체 뷰로 복귀
      const selectedNode = (nodes as Node[]).find(n => n.id === selectedL5);
      if (selectedNode) {
        setCenter(
          selectedNode.position.x + 110, // 노드 너비의 절반
          selectedNode.position.y + 50,  // 노드 높이의 절반
          { zoom: 1, duration: 800 }
        );
      }
      // 애니메이션 후 모드 변경
      setTimeout(() => {
        setViewMode('l5-all');
        setSelectedL5(null);
      }, 800);
    }
  }, [viewMode, setViewMode, setSelectedL5, selectedEdge, selectedL5, nodes, setCenter]);

  // 검색 기능 (l5-all 모드에서만 작동)
  useEffect(() => {
    // l5-all 모드가 아니면 검색 비활성화
    if (viewMode !== 'l5-all') {
      setCurrentSearchIndex(0);
      setSearchedNodeId(null);
      onSearchResultsChange?.(0, 0);
      return;
    }

    if (!searchQuery.trim() || nodes.length === 0) {
      setCurrentSearchIndex(0);
      setSearchedNodeId(null);
      onSearchResultsChange?.(0, 0);
      return;
    }

    // 대소문자 구분 없이 노드 이름에서 검색
    const query = searchQuery.toLowerCase();
    const matchingNodes = (nodes as Node[]).filter(node => {
      const label = (node.data as any)?.label || '';
      return label.toLowerCase().includes(query);
    });

    if (matchingNodes.length === 0) {
      setCurrentSearchIndex(0);
      setSearchedNodeId(null);
      onSearchResultsChange?.(0, 0);
      return;
    }

    // 다음 검색 결과로 이동
    const nextIndex = currentSearchIndex % matchingNodes.length;
    const targetNode = matchingNodes[nextIndex];

    if (targetNode) {
      // 검색된 노드 ID 설정
      setSearchedNodeId(targetNode.id);

      // viewport를 해당 노드로 이동
      setCenter(
        targetNode.position.x + 110, // 노드 너비의 절반
        targetNode.position.y + 50,  // 노드 높이의 절반
        { zoom: 1.2, duration: 500 }
      );
    }

    setCurrentSearchIndex(nextIndex + 1);
    onSearchResultsChange?.(matchingNodes.length, nextIndex + 1);
  }, [searchTrigger, viewMode]);

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
        edgeTypes={edgeTypes}
        fitView={shouldFitView}
        minZoom={0.1}
        maxZoom={2}
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

interface L5FlowGraphProps {
  searchQuery?: string;
  searchTrigger?: number;
  onSearchResultsChange?: (count: number, index: number) => void;
}

export default function L5FlowGraph({ searchQuery = '', searchTrigger = 0, onSearchResultsChange }: L5FlowGraphProps) {
  return (
    <ReactFlowProvider>
      <L5FlowGraphInner searchQuery={searchQuery} searchTrigger={searchTrigger} onSearchResultsChange={onSearchResultsChange} />
    </ReactFlowProvider>
  );
}
