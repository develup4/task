import { L6Task } from '@/types/task';

export interface DailyHeadcount {
  day: number; // 0-based day index
  headcount: number; // Total P needed on this day
  tasks: { id: string; name: string; P: number }[]; // Tasks active on this day
}

export interface HeadcountResult {
  maxHeadcount: number; // Maximum P needed on any single day
  dailyHeadcounts: DailyHeadcount[]; // Headcount for each day
  totalDays: number; // Total project duration in days
}

/**
 * L6 태스크들의 날짜별 필요인력을 계산합니다.
 * T(weeks)를 일(days)로 변환하여 계산합니다.
 */
export function calculateDailyHeadcount(l6Tasks: L6Task[]): HeadcountResult {
  if (l6Tasks.length === 0) {
    return { maxHeadcount: 0, dailyHeadcounts: [], totalDays: 0 };
  }

  const taskMap = new Map(l6Tasks.map(t => [t.id, t]));

  // 각 태스크의 시작일과 종료일 계산
  interface TaskSchedule {
    startDay: number;
    endDay: number; // exclusive (작업이 끝난 다음 날)
    P: number;
    id: string;
    name: string;
  }

  const schedules: TaskSchedule[] = [];
  const taskStartDays = new Map<string, number>();

  // DFS로 각 태스크의 시작일 계산
  const calculateStartDay = (taskId: string, visited: Set<string> = new Set()): number => {
    if (taskStartDays.has(taskId)) {
      return taskStartDays.get(taskId)!;
    }

    if (visited.has(taskId)) {
      // 순환 참조 - 0으로 설정
      return 0;
    }

    const task = taskMap.get(taskId);
    if (!task) return 0;

    visited.add(taskId);

    // 선행 작업이 없으면 0일에 시작
    if (task.predecessors.length === 0) {
      taskStartDays.set(taskId, 0);
      visited.delete(taskId);
      return 0;
    }

    // 모든 선행 작업이 끝난 후에 시작
    let maxEndDay = 0;
    for (const predId of task.predecessors) {
      if (taskMap.has(predId)) {
        const predStartDay = calculateStartDay(predId, new Set(visited));
        const predTask = taskMap.get(predId)!;
        const predDuration = Math.ceil((predTask.필요기간 || 0) * 5); // weeks to days (5 days/week)
        const predEndDay = predStartDay + predDuration;
        maxEndDay = Math.max(maxEndDay, predEndDay);
      }
    }

    taskStartDays.set(taskId, maxEndDay);
    visited.delete(taskId);
    return maxEndDay;
  };

  // 모든 태스크의 시작일 계산
  l6Tasks.forEach(task => {
    const startDay = calculateStartDay(task.id);
    const durationInDays = Math.ceil((task.필요기간 || 0) * 5); // weeks to days
    const endDay = startDay + durationInDays;

    schedules.push({
      startDay,
      endDay,
      P: task.필요인력 || 0,
      id: task.id,
      name: task.name,
    });
  });

  // 전체 프로젝트 기간 계산
  const totalDays = Math.max(...schedules.map(s => s.endDay), 0);

  // 날짜별 필요인력 계산
  const dailyHeadcounts: DailyHeadcount[] = [];
  let maxHeadcount = 0;

  for (let day = 0; day < totalDays; day++) {
    const activeTasks = schedules.filter(s => day >= s.startDay && day < s.endDay);
    const headcount = activeTasks.reduce((sum, t) => sum + t.P, 0);

    dailyHeadcounts.push({
      day,
      headcount,
      tasks: activeTasks.map(t => ({ id: t.id, name: t.name, P: t.P })),
    });

    maxHeadcount = Math.max(maxHeadcount, headcount);
  }

  return {
    maxHeadcount,
    dailyHeadcounts,
    totalDays,
  };
}
