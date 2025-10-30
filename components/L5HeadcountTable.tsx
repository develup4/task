"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatDecimal } from "@/utils/format";

export default function L5HeadcountTable() {
  const { processedData, selectedL5 } = useAppStore();

  const l5HeadcountData = useMemo(() => {
    if (!selectedL5 || !processedData) return null;

    // 선택된 L5와 모든 선행 L5 노드들 수집
    const predecessorIds = new Set<string>([selectedL5]);
    const visited = new Set<string>();

    const collectPredecessors = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = processedData.l5Tasks.get(taskId);
      if (!task) return;

      task.predecessors.forEach((predId) => {
        predecessorIds.add(predId);
        collectPredecessors(predId);
      });
    };

    collectPredecessors(selectedL5);

    // 필터링된 L5 노드들 수집
    const filteredL5Tasks = Array.from(processedData.l5Tasks.values()).filter(
      (t) => predecessorIds.has(t.id)
    );

    // 필요인력 정렬 및 통계
    const headcounts = filteredL5Tasks
      .map((t) => ({
        id: t.id,
        name: t.name,
        headcount: t.필요인력 || 0,
      }))
      .sort((a, b) => b.headcount - a.headcount);

    const maxHeadcount = Math.max(...headcounts.map((h) => h.headcount), 0);
    const avgHeadcount =
      headcounts.length > 0
        ? headcounts.reduce((sum, h) => sum + h.headcount, 0) /
          headcounts.length
        : 0;

    return {
      headcounts,
      maxHeadcount,
      avgHeadcount,
      totalTasks: headcounts.length,
    };
  }, [selectedL5, processedData]);

  if (!l5HeadcountData || l5HeadcountData.totalTasks === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        필요인력 데이터가 없습니다.
      </div>
    );
  }

  const { headcounts, maxHeadcount, avgHeadcount, totalTasks } =
    l5HeadcountData;

  // 색상 배열
  const colors = [
    "bg-purple-300",
    "bg-purple-400",
    "bg-purple-500",
    "bg-purple-600",
    "bg-indigo-300",
    "bg-indigo-400",
    "bg-indigo-500",
    "bg-indigo-600",
    "bg-violet-300",
    "bg-violet-400",
    "bg-violet-500",
    "bg-violet-600",
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          L5 노드별 필요인력
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          총 노드: {totalTasks}개 | 최대 필요인력:{" "}
          <span className="font-bold text-purple-600">
            {formatDecimal(maxHeadcount)}명
          </span>{" "}
          | 평균 필요인력:{" "}
          <span className="font-bold text-purple-600">
            {formatDecimal(avgHeadcount)}명
          </span>
        </p>
      </div>

      {/* 필요인력 차트 */}
      <div className="border border-gray-400 rounded-lg p-4 pb-8">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          노드별 필요인력 비교
        </h4>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {headcounts.map((item, idx) => {
            const percentage = (item.headcount / maxHeadcount) * 100;
            const barColor = colors[idx % colors.length];

            return (
              <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div
                  style={{
                    minWidth: "120px",
                    fontSize: "12px",
                    color: "#666",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.name}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                    height: "20px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className={barColor}
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    minWidth: "40px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  {formatDecimal(item.headcount)}명
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 노드 목록 테이블 */}
      <div className="border border-gray-400 rounded-lg overflow-hidden">
        <h4 className="text-sm font-semibold text-gray-700 p-4 pb-2">
          상세 정보
        </h4>
        <div
          style={{
            overflowX: "auto",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  노드명
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  필요인력
                </th>
              </tr>
            </thead>
            <tbody>
              {headcounts.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td
                    style={{
                      padding: "8px 12px",
                      color: "#374151",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "200px",
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      textAlign: "right",
                      color: "#374151",
                      fontWeight: 500,
                    }}
                  >
                    {formatDecimal(item.headcount)}명
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
