'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { calculateDailyHeadcount, DailyHeadcount } from '@/utils/headcountCalculator';

export default function HeadcountTable() {
  const { getL6TasksForL5, selectedL5 } = useAppStore();

  const headcountResult = useMemo(() => {
    if (!selectedL5) return null;
    const l6Tasks = getL6TasksForL5(selectedL5);
    return calculateDailyHeadcount(l6Tasks);
  }, [selectedL5, getL6TasksForL5]);

  if (!headcountResult || headcountResult.totalDays === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        필요인력 데이터가 없습니다.
      </div>
    );
  }

  const { dailyHeadcounts, maxHeadcount, totalDays } = headcountResult;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-h-[600px] overflow-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">날짜별 필요인력</h3>
        <p className="text-sm text-gray-500 mt-1">
          총 기간: {totalDays}일 | 최대 필요인력: <span className="font-bold text-purple-600">{maxHeadcount.toFixed(1)}명</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-sm table-pin-rows">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-center">Day</th>
              <th className="text-center">Week</th>
              <th className="text-center">필요인력 (P)</th>
              <th className="text-left">진행 중인 작업</th>
            </tr>
          </thead>
          <tbody>
            {dailyHeadcounts.map((day: DailyHeadcount) => {
              const isMaxDay = day.headcount === maxHeadcount && maxHeadcount > 0;
              const weekNumber = Math.floor(day.day / 5) + 1;
              const dayOfWeek = (day.day % 5) + 1;

              return (
                <tr
                  key={day.day}
                  className={`hover:bg-gray-50 ${isMaxDay ? 'bg-purple-50' : ''}`}
                >
                  <td className="text-center font-mono text-sm">
                    {day.day + 1}
                  </td>
                  <td className="text-center text-sm text-gray-600">
                    W{weekNumber}-D{dayOfWeek}
                  </td>
                  <td className="text-center">
                    <span
                      className={`font-bold ${
                        isMaxDay
                          ? 'text-purple-600 text-lg'
                          : day.headcount > 0
                          ? 'text-gray-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {day.headcount.toFixed(1)}
                    </span>
                  </td>
                  <td>
                    {day.tasks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {day.tasks.map((task) => (
                          <span
                            key={task.id}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                            title={`${task.name} (P: ${task.P})`}
                          >
                            {task.id} ({task.P})
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
  );
}
