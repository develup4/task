"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatDecimal } from "@/utils/format";

interface IntervalHeadcount {
  startWeek: number;
  endWeek: number;
  headcount: number;
  tasks: { id: string; name: string; P: number }[];
}

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

    if (filteredL5Tasks.length === 0) return null;

    // L5 tasks를 사용하여 타임테이블 기반 최대 필요인력 계산
    const taskMap = new Map(filteredL5Tasks.map((t) => [t.id, t]));

    interface TaskSchedule {
      startWeek: number;
      endWeek: number;
      P: number;
      id: string;
      name: string;
    }

    const schedules: TaskSchedule[] = [];
    const taskStartWeeks = new Map<string, number>();

    // DFS로 각 태스크의 시작 week 계산
    const calculateStartWeek = (
      taskId: string,
      visited: Set<string> = new Set(),
    ): number => {
      if (taskStartWeeks.has(taskId)) {
        return taskStartWeeks.get(taskId)!;
      }

      if (visited.has(taskId)) {
        return 0;
      }

      const task = taskMap.get(taskId);
      if (!task) return 0;

      visited.add(taskId);

      // 선행 작업이 없거나 선행 작업이 필터링된 경우 0 week에 시작
      if (task.predecessors.length === 0) {
        taskStartWeeks.set(taskId, 0);
        visited.delete(taskId);
        return 0;
      }

      // 모든 선행 작업이 끝난 후에 시작
      let maxEndWeek = 0;
      for (const predId of task.predecessors) {
        if (taskMap.has(predId)) {
          const predStartWeek = calculateStartWeek(predId, new Set(visited));
          const predTask = taskMap.get(predId)!;
          const predDuration = predTask.필요기간 || 0;
          const predEndWeek = predStartWeek + predDuration;
          maxEndWeek = Math.max(maxEndWeek, predEndWeek);
        }
      }

      taskStartWeeks.set(taskId, maxEndWeek);
      visited.delete(taskId);
      return maxEndWeek;
    };

    // 모든 L5 태스크의 시작/종료 week 계산
    filteredL5Tasks.forEach((task) => {
      const startWeek = calculateStartWeek(task.id);
      const duration = task.필요기간 || 0;
      const endWeek = startWeek + duration;

      schedules.push({
        startWeek,
        endWeek,
        P: task.필요인력 || 0,
        id: task.id,
        name: task.name,
      });
    });

    // 모든 시작/종료 시점을 수집하여 정렬 (구간 나누기)
    const timePoints = new Set<number>();
    timePoints.add(0);
    schedules.forEach((s) => {
      timePoints.add(s.startWeek);
      timePoints.add(s.endWeek);
    });

    const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
    const totalWeeks = Math.max(...sortedTimePoints, 0);

    // 각 구간별 필요인력 계산
    const intervals: IntervalHeadcount[] = [];
    let maxHeadcount = 0;

    for (let i = 0; i < sortedTimePoints.length - 1; i++) {
      const startWeek = sortedTimePoints[i];
      const endWeek = sortedTimePoints[i + 1];

      // 이 구간에서 활성화된 태스크들 찾기
      const activeTasks = schedules.filter(
        (s) => s.startWeek <= startWeek && s.endWeek >= endWeek,
      );

      const headcount = activeTasks.reduce((sum, t) => sum + t.P, 0);

      if (headcount > 0 || activeTasks.length > 0) {
        intervals.push({
          startWeek,
          endWeek,
          headcount,
          tasks: activeTasks.map((t) => ({ id: t.id, name: t.name, P: t.P })),
        });

        if (headcount > maxHeadcount) {
          maxHeadcount = headcount;
        }
      }
    }

    return {
      maxHeadcount,
      intervals,
      totalWeeks,
      totalTasks: filteredL5Tasks.length,
    };
  }, [selectedL5, processedData]);

  if (!l5HeadcountData || l5HeadcountData.totalTasks === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        필요인력 데이터가 없습니다.
      </div>
    );
  }

  const { maxHeadcount, intervals, totalWeeks, totalTasks } =
    l5HeadcountData;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          최대 필요인력
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          최대 필요인력:{" "}
          <span className="font-bold text-purple-600">
            {formatDecimal(maxHeadcount)}명
          </span>
          {" | "}
          총 기간:{" "}
          <span className="font-bold text-purple-600">
            {formatDecimal(totalWeeks)}W
          </span>
        </p>
      </div>

      {/* 시간별 필요인력 테이블 */}
      <div className="border border-gray-400 rounded-lg overflow-hidden">
        <h4 className="text-sm font-semibold text-gray-700 p-4 pb-2">
          기간별 필요인력
        </h4>
        <div
          style={{
            overflowX: "auto",
            maxHeight: "400px",
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
                  기간
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
              {intervals.map((interval, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor:
                      interval.headcount === maxHeadcount && maxHeadcount > 0
                        ? "#FFF7E6"
                        : idx % 2 === 0
                          ? "#ffffff"
                          : "#f9fafb",
                  }}
                >
                  <td
                    style={{
                      padding: "8px 12px",
                      color: "#374151",
                    }}
                  >
                    W{formatDecimal(interval.startWeek)}-W{formatDecimal(interval.endWeek)}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      textAlign: "right",
                      color: interval.headcount === maxHeadcount && maxHeadcount > 0
                        ? "#D97706"
                        : "#374151",
                      fontWeight: interval.headcount === maxHeadcount && maxHeadcount > 0
                        ? 600
                        : 500,
                    }}
                  >
                    {formatDecimal(interval.headcount)}명
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 활성 노드 목록 */}
      {intervals.length > 0 && (
        <div className="border border-gray-400 rounded-lg overflow-hidden">
          <h4 className="text-sm font-semibold text-gray-700 p-4 pb-2">
            최대 필요인력 구간의 활성 노드
          </h4>
          <div
            style={{
              overflowX: "auto",
              maxHeight: "250px",
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
                {(() => {
                  // 최대 필요인력 구간의 활성 노드 찾기
                  const maxInterval = intervals.find(
                    (i) => i.headcount === maxHeadcount && maxHeadcount > 0
                  );
                  if (!maxInterval) return null;

                  return maxInterval.tasks.map((task, idx) => (
                    <tr
                      key={task.id}
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
                        title={task.name}
                      >
                        {task.name}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {formatDecimal(task.P)}명
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
