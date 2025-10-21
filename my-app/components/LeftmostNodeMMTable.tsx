'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { getColorForCategory } from '@/utils/colors';

interface LeftmostNodeData {
  id: string;
  name: string;
  l4Category: string;
  cumulativeMM: number;
  필요인력: number;
  필요기간: number;
  MM: number;
}

export default function LeftmostNodeMMTable() {
  const { processedData, setSelectedL5, setViewMode } = useAppStore();

  const leftmostNodes = useMemo<LeftmostNodeData[]>(() => {
    if (!processedData) return [];

    const tasks = Array.from(processedData.l5Tasks.values());

    // 엣지 정보 구축
    const edges: Array<{ source: string; target: string }> = [];
    tasks.forEach((task) => {
      task.successors.forEach((successorId) => {
        if (tasks.some((t) => t.id === successorId)) {
          edges.push({ source: task.id, target: successorId });
        }
      });
    });

    // 레벨 계산 (후행 노드 기준)
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (nodeId: string): number => {
      if (levels.has(nodeId)) return levels.get(nodeId)!;
      if (visited.has(nodeId)) return 0;

      visited.add(nodeId);

      const outgoingEdges = edges.filter(e => e.source === nodeId);

      if (outgoingEdges.length === 0) {
        levels.set(nodeId, 0);
        return 0;
      }

      const maxSuccessorLevel = Math.max(
        ...outgoingEdges.map(e => calculateLevel(e.target))
      );
      const level = maxSuccessorLevel + 1;
      levels.set(nodeId, level);
      return level;
    };

    tasks.forEach(task => calculateLevel(task.id));

    // 최대 레벨 찾기
    const maxLevel = Math.max(...Array.from(levels.values()));

    // 가장 왼쪽 노드들 찾기 (최대 레벨)
    const leftmostNodeIds = new Set<string>();
    tasks.forEach(task => {
      if (levels.get(task.id) === maxLevel) {
        leftmostNodeIds.add(task.id);
      }
    });

    // 누적 MM 계산
    const cumulativeMMs = new Map<string, number>();

    const calculateCumulativeMM = (nodeId: string, visitedNodes = new Set<string>()): number => {
      if (cumulativeMMs.has(nodeId)) {
        return cumulativeMMs.get(nodeId)!;
      }

      if (visitedNodes.has(nodeId)) {
        return 0;
      }

      const task = tasks.find(t => t.id === nodeId);
      if (!task) return 0;

      const newVisited = new Set(visitedNodes);
      newVisited.add(nodeId);

      const incomingEdges = edges.filter(e => e.target === nodeId);

      let maxPredecessorMM = 0;
      if (incomingEdges.length > 0) {
        maxPredecessorMM = Math.max(
          ...incomingEdges.map(e => calculateCumulativeMM(e.source, newVisited))
        );
      }

      const cumulativeMM = task.MM + maxPredecessorMM;
      cumulativeMMs.set(nodeId, cumulativeMM);

      return cumulativeMM;
    };

    tasks.forEach(task => calculateCumulativeMM(task.id));

    // 가장 왼쪽 노드들의 데이터 수집
    const result: LeftmostNodeData[] = [];
    leftmostNodeIds.forEach(nodeId => {
      const task = tasks.find(t => t.id === nodeId);
      if (task) {
        result.push({
          id: task.id,
          name: task.name,
          l4Category: task.l4Category,
          cumulativeMM: cumulativeMMs.get(nodeId) || task.MM,
          필요인력: task.필요인력,
          필요기간: task.필요기간,
          MM: task.MM,
        });
      }
    });

    // 누적 MM 내림차순 정렬
    return result.sort((a, b) => b.cumulativeMM - a.cumulativeMM);
  }, [processedData]);

  const handleRowClick = (nodeId: string) => {
    setSelectedL5(nodeId);
    setViewMode('l5-filtered');
  };

  if (leftmostNodes.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>순위</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Task 이름</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>카테고리</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>필요인력 (P)</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>필요기간 (T)</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>MM</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>누적 MM</th>
          </tr>
        </thead>
        <tbody>
          {leftmostNodes.map((node, index) => {
            const colors = getColorForCategory(node.l4Category);
            return (
              <tr
                key={node.id}
                onClick={() => handleRowClick(node.id)}
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ padding: '12px' }}>{index + 1}</td>
                <td style={{ padding: '12px', fontWeight: 500 }}>{node.name}</td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      fontSize: '12px',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {node.l4Category}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{node.필요인력}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{node.필요기간}W</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  {node.MM.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#FF6B00',
                  }}
                >
                  {node.cumulativeMM.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #ddd' }}>
            <td colSpan={6} style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
              전체 합계
            </td>
            <td
              style={{
                padding: '12px',
                textAlign: 'right',
                fontWeight: 700,
                color: '#FF6B00',
                fontSize: '16px',
              }}
            >
              {leftmostNodes.reduce((sum, node) => sum + node.cumulativeMM, 0).toFixed(1)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
