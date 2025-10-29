"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getColorForCategory } from "@/utils/colors";

type SortColumn = "MM" | "cumulativeMM" | "l4Category";
type SortOrder = "asc" | "desc";

interface MMSummaryTableProps {
  type: "l5" | "final";
  onNavigateToGraph?: () => void;
  hiddenL4Categories?: Set<string>;
  onHiddenL4CategoriesChange?: (categories: Set<string>) => void;
}

export default function MMSummaryTable({
  type,
  onNavigateToGraph,
  hiddenL4Categories: externalHiddenL4Categories,
  onHiddenL4CategoriesChange,
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
  const [internalHiddenL4Categories, setInternalHiddenL4Categories] = useState<Set<string>>(new Set());

  // 외부에서 전달되면 그것을 사용, 아니면 내부 상태 사용
  const hiddenL4Categories = externalHiddenL4Categories !== undefined ? externalHiddenL4Categories : internalHiddenL4Categories;
  const setHiddenL4Categories = (categories: Set<string>) => {
    if (externalHiddenL4Categories !== undefined && onHiddenL4CategoriesChange) {
      onHiddenL4CategoriesChange(categories);
    } else {
      setInternalHiddenL4Categories(categories);
    }
  };

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

    // L4 카테고리 필터 적용 (숨겨진 카테고리 제외)
    if (hiddenL4Categories.size > 0) {
      tasks = tasks.filter((task) =>
        !hiddenL4Categories.has(task.l4Category)
      );
    }

    if (type === "l5") {
      // L5 task들 정렬
      tasks.sort((a, b) => {
        // L4 프로세스로 정렬할 때는 같은 L4 안에서 MM 내림차순
        if (sortColumn === "l4Category") {
          const categoryCompare = a.l4Category.localeCompare(b.l4Category);
          if (categoryCompare !== 0) {
            return sortOrder === "asc" ? categoryCompare : -categoryCompare;
          }
          // 같은 L4 카테고리면 MM으로 내림차순 정렬
          return b.MM - a.MM;
        }

        // MM으로 정렬
        if (sortColumn === "MM") {
          return sortOrder === "asc" ? a.MM - b.MM : b.MM - a.MM;
        }

        // 기본값 (MM 내림차순)
        return b.MM - a.MM;
      });
      return tasks;
    } else {
      // 최종 노드들 필터링 및 정렬
      tasks = tasks.filter(
        (task) => task.isFinalNode && task.cumulativeMM !== undefined
      );

      tasks.sort((a, b) => {
        // L4 프로세스로 정렬할 때는 같은 L4 안에서 누적MM 내림차순
        if (sortColumn === "l4Category") {
          const categoryCompare = a.l4Category.localeCompare(b.l4Category);
          if (categoryCompare !== 0) {
            return sortOrder === "asc" ? categoryCompare : -categoryCompare;
          }
          // 같은 L4 카테고리면 누적MM으로 내림차순 정렬
          return (b.cumulativeMM || 0) - (a.cumulativeMM || 0);
        }

        // 누적MM으로 정렬
        if (sortColumn === "cumulativeMM") {
          const valA = a.cumulativeMM || 0;
          const valB = b.cumulativeMM || 0;
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }

        // 기본값 (누적MM 내림차순)
        return (b.cumulativeMM || 0) - (a.cumulativeMM || 0);
      });
      return tasks;
    }
  }, [processedData, type, sortColumn, sortOrder, hiddenL4Categories]);

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
    const newHidden = new Set(hiddenL4Categories);
    if (newHidden.has(category)) {
      newHidden.delete(category);
    } else {
      newHidden.add(category);
    }
    setHiddenL4Categories(newHidden);
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
