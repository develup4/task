"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getColorForCategory } from "@/utils/colors";

type SortColumn = "MM" | "cumulativeMM" | "l4Category";
type SortOrder = "asc" | "desc";

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

  const [sortColumn, setSortColumn] = useState<SortColumn>("MM");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedL4Categories, setSelectedL4Categories] = useState<Set<string>>(new Set());

  const allL4Categories = useMemo(() => {
    if (!processedData) return [];
    const categories = new Set(
      Array.from(processedData.l5Tasks.values()).map((t) => t.l4Category)
    );
    return Array.from(categories).sort();
  }, [processedData]);

  const sortedTasks = useMemo(() => {
    if (!processedData) return [];

    let tasks = Array.from(processedData.l5Tasks.values());

    // L4 카테고리 필터 적용
    if (selectedL4Categories.size > 0) {
      tasks = tasks.filter((task) =>
        selectedL4Categories.has(task.l4Category)
      );
    }

    if (type === "l5") {
      // L5 task들 정렬
      tasks.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortColumn) {
          case "l4Category":
            aVal = a.l4Category;
            bVal = b.l4Category;
            break;
          case "MM":
            aVal = a.MM;
            bVal = b.MM;
            break;
          default:
            aVal = a.MM;
            bVal = b.MM;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        const numA = Number(aVal);
        const numB = Number(bVal);
        return sortOrder === "asc" ? numA - numB : numB - numA;
      });
      return tasks;
    } else {
      // 최종 노드들 필터링 및 정렬
      tasks = tasks.filter(
        (task) => task.isFinalNode && task.cumulativeMM !== undefined
      );

      tasks.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortColumn) {
          case "l4Category":
            aVal = a.l4Category;
            bVal = b.l4Category;
            break;
          case "cumulativeMM":
            aVal = a.cumulativeMM || 0;
            bVal = b.cumulativeMM || 0;
            break;
          default:
            aVal = a.cumulativeMM || 0;
            bVal = b.cumulativeMM || 0;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        const numA = Number(aVal);
        const numB = Number(bVal);
        return sortOrder === "asc" ? numA - numB : numB - numA;
      });
      return tasks;
    }
  }, [processedData, type, sortColumn, sortOrder, selectedL4Categories]);

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

  const handleL4FilterToggle = (category: string) => {
    const newSelected = new Set(selectedL4Categories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedL4Categories(newSelected);
  };

  const handleSortColumnClick = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("desc");
    }
  };

  if (sortedTasks.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Filter Controls */}
      <div style={{ padding: "16px", borderBottom: "1px solid #eee", backgroundColor: "#fafafa" }}>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#666", display: "block", marginBottom: "8px" }}>
            L4 프로세스 필터
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {allL4Categories.map((category) => {
              const colors = getColorForCategory(category);
              const isSelected = selectedL4Categories.has(category);
              return (
                <button
                  key={category}
                  onClick={() => handleL4FilterToggle(category)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: `2px solid ${colors.border}`,
                    backgroundColor: isSelected ? colors.bg : "white",
                    color: isSelected ? colors.text : colors.text,
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: isSelected ? 1 : 0.6,
                  }}
                >
                  {category}
                </button>
              );
            })}
            {selectedL4Categories.size > 0 && (
              <button
                onClick={() => setSelectedL4Categories(new Set())}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f0f0f0",
                  color: "#666",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
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
            <th style={{ padding: "12px", textAlign: "left" }}>순위</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Task 이름</th>
            <th
              onClick={() => handleSortColumnClick("l4Category")}
              style={{
                padding: "12px",
                textAlign: "left",
                cursor: "pointer",
                userSelect: "none",
                backgroundColor: sortColumn === "l4Category" ? "#e8e8e8" : "inherit",
                transition: "background-color 0.2s",
              }}
              title="클릭하여 정렬"
            >
              L4 프로세스{" "}
              {sortColumn === "l4Category" && (
                <span style={{ marginLeft: "4px" }}>
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              )}
            </th>
            <th style={{ padding: "12px", textAlign: "right" }}>
              필요인력 (P)
            </th>
            <th style={{ padding: "12px", textAlign: "right" }}>
              필요기간 (T)
            </th>
            <th
              onClick={() => handleSortColumnClick("MM")}
              style={{
                padding: "12px",
                textAlign: "right",
                cursor: "pointer",
                userSelect: "none",
                backgroundColor: sortColumn === "MM" ? "#e8e8e8" : "inherit",
                transition: "background-color 0.2s",
              }}
              title="클릭하여 정렬"
            >
              MM {sortColumn === "MM" && (
                <span style={{ marginLeft: "4px" }}>
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              )}
            </th>
            {type === "final" && (
              <th
                onClick={() => handleSortColumnClick("cumulativeMM")}
                style={{
                  padding: "12px",
                  textAlign: "right",
                  cursor: "pointer",
                  userSelect: "none",
                  backgroundColor: sortColumn === "cumulativeMM" ? "#e8e8e8" : "inherit",
                  transition: "background-color 0.2s",
                }}
                title="클릭하여 정렬"
              >
                누적 MM {sortColumn === "cumulativeMM" && (
                  <span style={{ marginLeft: "4px" }}>
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
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
                  {task.필요기간.toFixed(2)}W
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
    </div>
  );
}
