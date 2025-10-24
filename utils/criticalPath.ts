import { L6Task } from '@/types/task';

export interface CriticalPathResult {
  path: string[]; // L6 task IDs in critical path
  totalDuration: number; // Total T in weeks
}

/**
 * L6 태스크들의 크리티컬 패스를 계산합니다.
 * 가장 긴 경로(T의 합이 최대)를 찾습니다.
 */
export function calculateCriticalPath(l6Tasks: L6Task[]): CriticalPathResult {
  if (l6Tasks.length === 0) {
    return { path: [], totalDuration: 0 };
  }

  const taskMap = new Map(l6Tasks.map(t => [t.id, t]));

  // 각 노드까지의 최대 경로 길이와 경로를 저장
  const maxPath = new Map<string, { duration: number; path: string[] }>();

  // 시작 노드들 찾기 (선행이 없는 노드들)
  const startNodes = l6Tasks.filter(t => t.predecessors.length === 0);

  // DFS로 각 경로의 최대 길이 계산
  const dfs = (taskId: string, visited: Set<string>): { duration: number; path: string[] } => {
    // 이미 계산된 경우 반환
    if (maxPath.has(taskId) && !visited.has(taskId)) {
      return maxPath.get(taskId)!;
    }

    // 순환 참조 방지
    if (visited.has(taskId)) {
      return { duration: 0, path: [] };
    }

    const task = taskMap.get(taskId);
    if (!task) {
      return { duration: 0, path: [] };
    }

    visited.add(taskId);

    // 현재 태스크의 duration
    const currentDuration = task.필요기간 || 0;

    // 후행 노드가 없으면 현재 노드만 반환
    if (task.successors.length === 0) {
      const result = { duration: currentDuration, path: [taskId] };
      maxPath.set(taskId, result);
      visited.delete(taskId);
      return result;
    }

    // 모든 후행 노드 중 가장 긴 경로 찾기
    let maxSuccessorResult = { duration: 0, path: [] as string[] };

    for (const successorId of task.successors) {
      if (taskMap.has(successorId)) {
        const successorResult = dfs(successorId, new Set(visited));
        if (successorResult.duration > maxSuccessorResult.duration) {
          maxSuccessorResult = successorResult;
        }
      }
    }

    // 현재 노드 + 최대 후행 경로
    const result = {
      duration: currentDuration + maxSuccessorResult.duration,
      path: [taskId, ...maxSuccessorResult.path]
    };

    maxPath.set(taskId, result);
    visited.delete(taskId);
    return result;
  };

  // 모든 시작 노드에서 시작하여 최대 경로 찾기
  let criticalPath: CriticalPathResult = { path: [], totalDuration: 0 };

  if (startNodes.length === 0) {
    // 시작 노드가 없으면 (모든 노드가 선행을 가짐 - 순환 구조) 모든 노드를 시도
    for (const task of l6Tasks) {
      const result = dfs(task.id, new Set());
      if (result.duration > criticalPath.totalDuration) {
        criticalPath = { path: result.path, totalDuration: result.duration };
      }
    }
  } else {
    // 정상적인 경우: 시작 노드들에서 시작
    for (const startNode of startNodes) {
      const result = dfs(startNode.id, new Set());
      if (result.duration > criticalPath.totalDuration) {
        criticalPath = { path: result.path, totalDuration: result.duration };
      }
    }
  }

  return criticalPath;
}
