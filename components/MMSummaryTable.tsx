"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { getColorForCategory } from "@/utils/colors";

type SortColumn = "MM" | "cumulativeMM";

interface MMSummaryTableProps {
  type: "l5" | "final";
  onNavigateToGraph?: () => void;
}

export default function MMSummaryTable({
  type,
  onNavigateToGraph,
}: MMSummaryTableProps) {
  const {
    processedData,
    setSelectedL5,
    setViewMode,
    setHighlightedTasks,
    l5MaxHeadcountMap,
  } = useAppStore();

  const sortedTasks = useMemo(() => {
    if (!processedData) return [];

    const tasks = Array.from(processedData.l5Tasks.values());

    if (type === "l5") {
      // L5 task들을 MM 기준으로 정렬
      return tasks.sort((a, b) => b.MM - a.MM);
    } else {
      // 최종 노드들을 누적 MM 기준으로 정렬
      return tasks
        .filter((task) => task.isFinalNode && task.cumulativeMM !== undefined)
        .sort((a, b) => (b.cumulativeMM || 0) - (a.cumulativeMM || 0));
    }
  }, [processedData, type]);

  const handleRowClick = (taskId: string) => {
    setSelectedL5(taskId);
    if (type === "l5") {
      // L5 테이블: 해당 L5에 속한 L6 그래프로 이동
      // L5 그래프의 노드 클릭 로직과 동일하게 l5-filtered를 거치지 않고 바로 l6-detail로 이동
      setViewMode("l6-detail");
    } else {
      // 최종 노드 테이블: 관련 workflow 하이라이트
      setViewMode("l5-filtered");

      // 해당 task와 관련된 모든 선행 task들을 하이라이트
      const highlightedSet = new Set<string>([taskId]);
      const addPredecessors = (id: string) => {
        const task = processedData?.l5Tasks.get(id);
        if (task) {
          task.predecessors.forEach((predId) => {
            if (!highlightedSet.has(predId)) {
              highlightedSet.add(predId);
              addPredecessors(predId);
            }
          });
        }
      };
      addPredecessors(taskId);
      setHighlightedTasks(highlightedSet);
    }
    onNavigateToGraph?.();
  };

  if (sortedTasks.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#f5f5f5",
              borderBottom: "2px solid #ddd",
            }}
          >
            <th style={{ padding: "12px", textAlign: "left" }}>순위</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Task 이름</th>
            <th style={{ padding: "12px", textAlign: "left" }}>L4 프로세스</th>
            <th style={{ padding: "12px", textAlign: "right" }}>
              필요인력 (P)
            </th>
            <th style={{ padding: "12px", textAlign: "right" }}>
              필요기간 (T)
            </th>
            <th style={{ padding: "12px", textAlign: "right" }}>MM</th>
            {type === "final" && (
              <th style={{ padding: "12px", textAlign: "right" }}>누적 MM</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task, index) => {
            const colors = getColorForCategory(task.l4Category);
            return (
              <tr
                key={task.id}
                onClick={() => handleRowClick(task.id)}
                style={{
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <td style={{ padding: "12px" }}>{index + 1}</td>
                <td style={{ padding: "12px", fontWeight: 500 }}>
                  {task.name}
                </td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: colors.bg,
                      color: colors.text,
                      fontSize: "12px",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {task.l4Category}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  {l5MaxHeadcountMap.get(task.id) || 0}
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  {task.필요기간}W
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {task.MM.toFixed(1)}
                </td>
                {type === "final" && (
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      color: colors.border,
                    }}
                  >
                    {task.cumulativeMM?.toFixed(1)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
