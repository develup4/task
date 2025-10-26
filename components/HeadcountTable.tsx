"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import {
  calculateDailyHeadcount,
  IntervalHeadcount,
} from "@/utils/headcountCalculator";

export default function HeadcountTable() {
  const { getL6TasksForL5, selectedL5 } = useAppStore();

  const headcountResult = useMemo(() => {
    if (!selectedL5) return null;
    const l6Tasks = getL6TasksForL5(selectedL5);
    return calculateDailyHeadcount(l6Tasks);
  }, [selectedL5, getL6TasksForL5]);

  if (!headcountResult || headcountResult.totalWeeks === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        필요인력 데이터가 없습니다.
      </div>
    );
  }

  const { intervals, maxHeadcount, totalWeeks } = headcountResult;

  // 차트 높이 계산
  const chartHeight = 300;
  const barHeight = 20;

  // 구간별 색상 배열 (보라색 계열)
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

  // 구간 색상 할당 함수
  const getIntervalColor = (idx: number) => {
    return colors[idx % colors.length];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          시간대별 필요인력
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          총 기간: {totalWeeks.toFixed(2)}주 | 최대 필요인력:{" "}
          <span className="font-bold text-purple-600">
            {maxHeadcount.toFixed(1)}명
          </span>
        </p>
      </div>

      {/* 필요인력 차트 */}
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          필요인력 변화 그래프
        </h4>
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          {/* Y축 (필요인력) */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
            <span>{maxHeadcount.toFixed(1)}</span>
            <span>{(maxHeadcount * 0.75).toFixed(1)}</span>
            <span>{(maxHeadcount * 0.5).toFixed(1)}</span>
            <span>{(maxHeadcount * 0.25).toFixed(1)}</span>
            <span>0</span>
          </div>

          {/* 차트 영역 */}
          <div className="absolute left-12 right-0 top-0 bottom-12 border-l border-b border-gray-300">
            {/* 가로 그리드 라인 */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <div
                key={ratio}
                className="absolute left-0 right-0 border-t border-gray-200"
                style={{ top: `${(1 - ratio) * 100}%` }}
              />
            ))}

            {/* 필요인력 막대 그래프 */}
            {intervals.map((interval, idx) => {
              const leftPercent = (interval.startWeek / totalWeeks) * 100;
              const widthPercent =
                ((interval.endWeek - interval.startWeek) / totalWeeks) * 100;
              const heightPercent = (interval.headcount / maxHeadcount) * 100;
              const intervalColor = getIntervalColor(idx);

              return (
                <div key={idx}>
                  {/* 구간 막대 */}
                  <div
                    className={`absolute ${intervalColor} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    style={{
                      left: `${leftPercent}%`,
                      bottom: 0,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                    title={`${interval.startWeek.toFixed(
                      2
                    )}w ~ ${interval.endWeek.toFixed(
                      2
                    )}w: ${interval.headcount.toFixed(1)}명`}
                  />
                  {/* 구간 끝 border (마지막 구간 제외) */}
                  {idx < intervals.length - 1 && (
                    <div
                      className="absolute top-0 bottom-0 border-l border-gray-300"
                      style={{
                        left: `${(interval.endWeek / totalWeeks) * 100}%`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* X축 (주) */}
          <div className="absolute left-12 right-0 top-[calc(100%+8px)] flex justify-between text-xs text-gray-500 pr-2">
            <span>0w</span>
            <span>{(totalWeeks * 0.25).toFixed(1)}w</span>
            <span>{(totalWeeks * 0.5).toFixed(1)}w</span>
            <span>{(totalWeeks * 0.75).toFixed(1)}w</span>
            <span>{totalWeeks.toFixed(1)}w</span>
          </div>
        </div>
      </div>

      {/* 구간별 상세 테이블 */}
      <div className="border rounded-lg overflow-hidden">
        <h4 className="text-sm font-semibold text-gray-700 p-3 bg-gray-50 border-b">
          구간별 상세 정보
        </h4>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="table table-sm w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-center w-28">구간 (Week)</th>
                <th className="text-center w-24">필요인력 (P)</th>
                <th className="text-left flex-1">진행 중인 작업</th>
              </tr>
            </thead>
            <tbody>
              {intervals.map((interval, idx) => {
                const intervalColor = getIntervalColor(idx);
                // 배경색을 lightness가 높은 버전으로 변환
                const bgColorMap: Record<string, string> = {
                  "bg-purple-300": "bg-purple-50",
                  "bg-purple-400": "bg-purple-50",
                  "bg-purple-500": "bg-purple-100",
                  "bg-purple-600": "bg-purple-100",
                  "bg-indigo-300": "bg-indigo-50",
                  "bg-indigo-400": "bg-indigo-50",
                  "bg-indigo-500": "bg-indigo-100",
                  "bg-indigo-600": "bg-indigo-100",
                  "bg-violet-300": "bg-violet-50",
                  "bg-violet-400": "bg-violet-50",
                  "bg-violet-500": "bg-violet-100",
                  "bg-violet-600": "bg-violet-100",
                };
                const bgColor = bgColorMap[intervalColor] || "bg-purple-50";

                return (
                  <tr
                    key={idx}
                    className={`${bgColor} [&:not(:last-child)]:border-b border-purple-100`}
                  >
                    <td className="text-center font-mono text-sm w-28">
                      {interval.startWeek.toFixed(2)} ~{" "}
                      {interval.endWeek.toFixed(2)}
                    </td>
                    <td className="text-center w-24">
                      <span
                        className={`font-bold ${
                          interval.headcount > 0
                            ? "text-gray-800"
                            : "text-gray-400"
                        }`}
                      >
                        {interval.headcount.toFixed(1)}
                      </span>
                    </td>
                    <td className="flex-1">
                      {interval.tasks.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {interval.tasks.map((task) => (
                            <span
                              key={task.id}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                              title={`${task.name} (P: ${task.P})`}
                            >
                              {task.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
