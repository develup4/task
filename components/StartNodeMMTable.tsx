"use client";

import { useAppStore } from "@/lib/store";
import { useMemo } from "react";

interface StartNodeData {
  l5Id: string;
  l5Name: string;
  l4Category: string;
  cumulativeMM: number;
}

interface StartNodeMMTableProps {
  onNavigateToGraph?: () => void;
}

export default function StartNodeMMTable({
  onNavigateToGraph,
}: StartNodeMMTableProps) {
  const { processedData, setSelectedL5, setViewMode } = useAppStore();

  const startNodeData = useMemo<StartNodeData[]>(() => {
    if (!processedData) return [];

    const result: StartNodeData[] = [];

    // 모든 L5 태스크를 순회
    processedData.l5Tasks.forEach((l5Task, l5Id) => {
      const l6Tasks = Array.from(processedData.l6Tasks.values()).filter(
        (task) => task.l5Parent === l5Id,
      );

      if (l6Tasks.length === 0) return;

      // L6 간의 연결 관계 파악
      const hasIncomingEdge = new Set<string>();
      l6Tasks.forEach((task) => {
        task.successors.forEach((successorId) => {
          if (l6Tasks.some((t) => t.id === successorId)) {
            hasIncomingEdge.add(successorId);
          }
        });
      });

      // 시작 노드 찾기 (incoming edge가 없는 노드)
      const startNodes = l6Tasks.filter(
        (task) => !hasIncomingEdge.has(task.id),
      );

      if (startNodes.length > 0) {
        // 전체 L6 태스크의 MM 합계
        const totalMM = l6Tasks.reduce((sum, task) => sum + task.MM, 0);

        result.push({
          l5Id,
          l5Name: l5Task.name,
          l4Category: l5Task.l4Category,
          cumulativeMM: totalMM,
        });
      }
    });

    // MM 내림차순 정렬
    return result.sort((a, b) => b.cumulativeMM - a.cumulativeMM);
  }, [processedData]);

  const handleRowClick = (l5Id: string) => {
    setSelectedL5(l5Id);
    setViewMode("l6-detail");
    onNavigateToGraph?.();
  };

  if (startNodeData.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        데이터가 없습니다. 엑셀 파일을 업로드해주세요.
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="table table-xs table-pin-rows">
        <thead>
          <tr>
            <th className="bg-base-200">순위</th>
            <th className="bg-base-200">L5 작업명</th>
            <th className="bg-base-200">L4 카테고리</th>
            <th className="bg-base-200">누적 MM</th>
          </tr>
        </thead>
        <tbody>
          {startNodeData.map((data, index) => (
            <tr
              key={data.l5Id}
              className="hover cursor-pointer"
              onClick={() => handleRowClick(data.l5Id)}
            >
              <td>{index + 1}</td>
              <td className="font-medium">{data.l5Name}</td>
              <td>
                <span className="badge badge-sm badge-outline">
                  {data.l4Category}
                </span>
              </td>
              <td className="font-bold text-orange-600">
                {data.cumulativeMM.toFixed(1)} MM
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={3} className="text-right bg-base-200">
              전체 합계
            </th>
            <th className="bg-base-200 text-orange-600">
              {startNodeData
                .reduce((sum, data) => sum + data.cumulativeMM, 0)
                .toFixed(1)}{" "}
              MM
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
