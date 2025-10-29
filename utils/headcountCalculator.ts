import { L6Task } from "@/types/task";

export interface IntervalHeadcount {
  startWeek: number; // Interval start (weeks)
  endWeek: number; // Interval end (weeks)
  headcount: number; // Total P needed in this interval
  tasks: { id: string; name: string; P: number }[]; // Tasks active in this interval
}

export interface HeadcountResult {
  maxHeadcount: number; // Maximum P needed in any interval
  intervals: IntervalHeadcount[]; // Headcount for each time interval
  totalWeeks: number; // Total project duration in weeks
  maxHeadcountTaskIds: string[]; // Task IDs that contributed to max headcount
}

/**
 * L6 태스크들의 시간 구간별 필요인력을 계산합니다.
 * Week 단위 실수(소수점)로 정확하게 계산합니다.
 */
export function calculateDailyHeadcount(l6Tasks: L6Task[]): HeadcountResult {
  if (l6Tasks.length === 0) {
    return { maxHeadcount: 0, intervals: [], totalWeeks: 0, maxHeadcountTaskIds: [] };
  }

  const taskMap = new Map(l6Tasks.map((t) => [t.id, t]));

  // 각 태스크의 시작/종료 시점 계산 (week 단위)
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
      // 순환 참조 - 0으로 설정
      return 0;
    }

    const task = taskMap.get(taskId);
    if (!task) return 0;

    visited.add(taskId);

    // 선행 작업이 없으면 0 week에 시작
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

  // 모든 태스크의 시작/종료 week 계산
  l6Tasks.forEach((task) => {
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
  timePoints.add(0); // 프로젝트 시작
  schedules.forEach((s) => {
    timePoints.add(s.startWeek);
    timePoints.add(s.endWeek);
  });

  const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
  const totalWeeks = Math.max(...sortedTimePoints, 0);

  // 각 구간별 필요인력 계산
  const intervals: IntervalHeadcount[] = [];
  let maxHeadcount = 0;
  let maxHeadcountTaskIds: string[] = [];

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

      // 최대 필요인력이 더 크거나 같으면 업데이트
      if (headcount > maxHeadcount) {
        maxHeadcount = headcount;
        maxHeadcountTaskIds = activeTasks.map((t) => t.id);
      } else if (headcount === maxHeadcount && headcount > 0) {
        // 같은 최대값인 경우, 이미 수집한 태스크들과 함께 유지
        // 하지만 여러 구간이 같은 최대값을 가질 수 있으므로, 첫 번째 최대값만 추적
      }
    }
  }

  return {
    maxHeadcount,
    intervals,
    totalWeeks,
    maxHeadcountTaskIds,
  };
}
