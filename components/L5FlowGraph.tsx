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

    // 나가는 엣지 (후행 작업)을 기준으로 레벨 계산
    const outgoingEdges = edges.filter(e => e.source === nodeId);

    // 후행 작업이 없으면 level 0 (최후단)
    if (outgoingEdges.length === 0) {
      levels.set(nodeId, 0);
      return 0;
    }

    // 후행 노드들의 최대 레벨 + 1
    const maxSuccessorLevel = Math.max(
      ...outgoingEdges.map(e => calculateLevel(e.target))
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
        // level 0이 왼쪽에 오도록 배치
        x: level * (nodeWidth + horizontalSpacing),
        y: indexInLevel * (nodeHeight + verticalSpacing),
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
  const { setCenter } = useReactFlow();

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
        fullData: task,
        isL5: true,
        isL6: false,
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

  // L5-filtered 또는 L6 진입 시 복귀 대상 노드 저장
  useEffect(() => {
    if ((viewMode === 'l5-filtered' || viewMode === 'l6-detail') && selectedL5) {
      setReturnTarget(selectedL5);
    }
  }, [viewMode, selectedL5]);

  // L5-all로 복귀 시 이전에 선택된 노드로 뷰포트 이동
  useEffect(() => {
    if (viewMode === 'l5-all' && returnTarget && nodes.length > 0) {
      const targetNode = (nodes as Node[]).find(n => n.id === returnTarget);
      if (targetNode) {
        setTimeout(() => {
          setCenter(
            targetNode.position.x + 110,
            targetNode.position.y + 50,
            { zoom: 1, duration: 800 }
          );
          // 복귀 완료 후 타겟 초기화
          setReturnTarget(null);
        }, 100);
      }
    }
  }, [viewMode, returnTarget, nodes, setCenter]);

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
        fitView
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
