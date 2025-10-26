"use client";

import { useAppStore } from "@/lib/store";
import { getColorForCategory } from "@/utils/colors";

interface ErrorListTableProps {
  onNavigateToGraph?: () => void;
}

export default function ErrorListTable({
  onNavigateToGraph,
}: ErrorListTableProps) {
  const { processedData, setSelectedL5, setViewMode, setHighlightedTasks } =
    useAppStore();

  const handleRowClick = (sourceTask: string, sourceLevel: string) => {
    // sourceLevel이 L5인 경우에만 navigate
    if (sourceLevel === "L5") {
      setSelectedL5(sourceTask);

      // 해당 task와 관련된 모든 선행/후행 task들을 하이라이트
      const highlightedSet = new Set<string>([sourceTask]);

      const addRelated = (id: string) => {
        const task = processedData?.l5Tasks.get(id);
        if (task) {
          // 선행 노드들 추가
          task.predecessors.forEach((predId) => {
            if (!highlightedSet.has(predId)) {
              highlightedSet.add(predId);
              addRelated(predId);
            }
          });
          // 후행 노드들 추가
          task.successors.forEach((succId) => {
            if (!highlightedSet.has(succId)) {
              highlightedSet.add(succId);
              addRelated(succId);
            }
          });
        }
      };

      addRelated(sourceTask);
      setHighlightedTasks(highlightedSet);
      setViewMode("l5-filtered");
      onNavigateToGraph?.();
    } else if (sourceLevel === "L6") {
      // L6인 경우 L5 task로 찾아서 이동
      const l5Task = Array.from(processedData?.l5Tasks.values() || []).find(
        (task) => task.l6Tasks?.some((l6) => l6.id === sourceTask)
      );

      if (l5Task) {
        setSelectedL5(l5Task.id);
        setViewMode("l6-detail");
        onNavigateToGraph?.();
      }
    }
  };

  if (
    !processedData ||
    !processedData.errors ||
    processedData.errors.length === 0
  ) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
        <p>검증 오류가 없습니다</p>
      </div>
    );
  }

  const errors = processedData.errors;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, overflow: "auto" }}>
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
              <th style={{ padding: "12px", textAlign: "center" }}>순위</th>
              <th style={{ padding: "12px", textAlign: "center" }}>레벨</th>
              <th style={{ padding: "12px", textAlign: "center" }}>
                오류 유형
              </th>
              <th style={{ padding: "12px", textAlign: "center" }}>
                소스 프로세스
              </th>
              <th style={{ padding: "12px", textAlign: "center" }}>
                관련 프로세스
              </th>
              <th style={{ padding: "12px", textAlign: "center" }}>설명</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error, index) => {
              const isL5 = error.sourceLevel === "L5";
              const task = isL5
                ? processedData.l5Tasks.get(error.sourceTask)
                : null;
              const colors = task
                ? getColorForCategory(task.l4Category)
                : { bg: "#f5f5f5", text: "#666", border: "#ddd" };

              return (
                <tr
                  key={index}
                  id={`error-row-${error.sourceTask}-${index}`}
                  onClick={() =>
                    handleRowClick(error.sourceTask, error.sourceLevel)
                  }
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    transition: "background-color 0.2s",
                    scrollMarginTop: "20px", // 스크롤 시 상단 여백
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <td style={{ padding: "12px" }}>{index + 1}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor:
                          error.sourceLevel === "L5" ? "#dbeafe" : "#d1fae5",
                        color:
                          error.sourceLevel === "L5" ? "#1e40af" : "#065f46",
                        fontSize: "12px",
                        border: `1px solid ${
                          error.sourceLevel === "L5" ? "#93c5fd" : "#6ee7b7"
                        }`,
                        fontWeight: 500,
                      }}
                    >
                      {error.sourceLevel}
                    </span>
                  </td>
                  <td className="min-w-32" style={{ padding: "12px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor:
                          error.type === "missing_predecessor"
                            ? "#fed7aa"
                            : error.type === "missing_successor"
                            ? "#e9d5ff"
                            : error.type === "self_loop_error"
                            ? "#fef3c7"
                            : error.type === "empty_predecessor_but_referenced"
                            ? "#fde68a"
                            : error.type === "empty_successor_but_referenced"
                            ? "#fde68a"
                            : error.type === "case_mismatch"
                            ? "#dbeafe"
                            : error.type === "mismatch_predecessor_successor"
                            ? "#fce7f3"
                            : error.type === "missing_l5_reference"
                            ? "#fecdd3"
                            : "#fecaca",
                        color:
                          error.type === "missing_predecessor"
                            ? "#9a3412"
                            : error.type === "missing_successor"
                            ? "#6b21a8"
                            : error.type === "self_loop_error"
                            ? "#92400e"
                            : error.type === "empty_predecessor_but_referenced"
                            ? "#78350f"
                            : error.type === "empty_successor_but_referenced"
                            ? "#78350f"
                            : error.type === "case_mismatch"
                            ? "#1e40af"
                            : error.type === "mismatch_predecessor_successor"
                            ? "#9f1239"
                            : error.type === "missing_l5_reference"
                            ? "#be123c"
                            : "#991b1b",
                        fontSize: "12px",
                        border: `1px solid ${
                          error.type === "missing_predecessor"
                            ? "#fb923c"
                            : error.type === "missing_successor"
                            ? "#c084fc"
                            : error.type === "self_loop_error"
                            ? "#fbbf24"
                            : error.type === "empty_predecessor_but_referenced"
                            ? "#fbbf24"
                            : error.type === "empty_successor_but_referenced"
                            ? "#fbbf24"
                            : error.type === "case_mismatch"
                            ? "#93c5fd"
                            : error.type === "mismatch_predecessor_successor"
                            ? "#f9a8d4"
                            : error.type === "missing_l5_reference"
                            ? "#fda4af"
                            : "#f87171"
                        }`,
                        fontWeight: 500,
                      }}
                    >
                      {error.type === "missing_predecessor"
                        ? "누락된 선행"
                        : error.type === "missing_successor"
                        ? "누락된 후행"
                        : error.type === "self_loop_error"
                        ? "Self-Loop 오류"
                        : error.type === "empty_predecessor_but_referenced"
                        ? "선행 입력 누락"
                        : error.type === "empty_successor_but_referenced"
                        ? "후행 입력 누락"
                        : error.type === "case_mismatch"
                        ? "대소문자 오류"
                        : error.type === "mismatch_predecessor_successor"
                        ? "선행/후행 불일치"
                        : error.type === "missing_l5_reference"
                        ? "누락된 L5 참조"
                        : error.type === "bidirectional_error"
                        ? "양방향 오류"
                        : "알 수 없는 오류"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontWeight: 500 }}>
                    {error.sourceTask}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: 600,
                      color: "#dc2626",
                    }}
                  >
                    {error.type === "bidirectional_error"
                      ? error.relatedTask
                      : error.type === "self_loop_error"
                      ? "-"
                      : error.type === "empty_predecessor_but_referenced"
                      ? error.relatedTask
                      : error.type === "empty_successor_but_referenced"
                      ? error.relatedTask
                      : error.type === "case_mismatch"
                      ? error.relatedTask
                      : error.type === "mismatch_predecessor_successor"
                      ? error.relatedTask
                      : error.type === "missing_l5_reference"
                      ? error.missingTask
                      : error.missingTask}
                  </td>
                  <td style={{ padding: "12px", color: "#666" }}>
                    {error.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: "16px",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #ddd",
          fontSize: "14px",
          color: "#666",
        }}
      >
        총{" "}
        <span style={{ fontWeight: 600, color: "#dc2626" }}>
          {errors.length}
        </span>
        개의 오류가 발견되었습니다.
      </div>
    </div>
  );
}
