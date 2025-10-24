import { L6Task } from '@/types/task';

export interface CriticalPathResult {
  paths: string[][]; // 모든 크리티컬 패스들 (동률 포함)
  totalDuration: number; // Total T in weeks
  allPathNodes: Set<string>; // 모든 크리티컬 패스에 속한 노드들
}

/**
 * L6 태스크들의 모든 크리티컬 패스를 계산합니다.
 * 가장 긴 경로(T의 합이 최대)를 모두 찾습니다 (동률 포함).
 */
export function calculateCriticalPath(l6Tasks: L6Task[]): CriticalPathResult {
  if (l6Tasks.length === 0) {
    return { paths: [], totalDuration: 0, allPathNodes: new Set() };
  }

  const taskMap = new Map(l6Tasks.map(t => [t.id, t]));

  // 각 노드에서 끝까지의 모든 경로를 저장
  const allPathsFromNode = new Map<string, { duration: number; path: string[] }[]>();

  // 시작 노드들 찾기 (선행이 없는 노드들)
  const startNodes = l6Tasks.filter(t => t.predecessors.length === 0);

  // DFS로 각 노드에서 시작하는 모든 경로 찾기
  const findAllPaths = (taskId: string, visited: Set<string>): { duration: number; path: string[] }[] => {
    // 순환 참조 방지
    if (visited.has(taskId)) {
      return [];
    }

    const task = taskMap.get(taskId);
    if (!task) {
      return [];
    }

    visited.add(taskId);

    // 현재 태스크의 duration (0이어도 포함)
    const currentDuration = task.필요기간 || 0;

    // 후행 노드가 없으면 현재 노드만 반환
    if (task.successors.length === 0) {
      visited.delete(taskId);
      return [{ duration: currentDuration, path: [taskId] }];
    }

    // 모든 후행 노드의 경로를 재귀적으로 수집
    const allPaths: { duration: number; path: string[] }[] = [];

    for (const successorId of task.successors) {
      if (taskMap.has(successorId)) {
        const successorPaths = findAllPaths(successorId, new Set(visited));

        // 각 후행 경로에 현재 노드를 앞에 추가
        for (const successorPath of successorPaths) {
          allPaths.push({
            duration: currentDuration + successorPath.duration,
            path: [taskId, ...successorPath.path]
          });
        }
      }
    }

    visited.delete(taskId);
    return allPaths;
  };

  // 모든 경로 수집
  let allPaths: { duration: number; path: string[] }[] = [];

  if (startNodes.length === 0) {
    // 시작 노드가 없으면 (모든 노드가 선행을 가짐 - 순환 구조) 모든 노드를 시도
    for (const task of l6Tasks) {
      const paths = findAllPaths(task.id, new Set());
      allPaths.push(...paths);
    }
  } else {
    // 정상적인 경우: 시작 노드들에서 시작
    for (const startNode of startNodes) {
      const paths = findAllPaths(startNode.id, new Set());
      allPaths.push(...paths);
    }
  }

  // 최대 duration 찾기
  const maxDuration = Math.max(...allPaths.map(p => p.duration), 0);

  // 최대 duration과 동일한 모든 경로 찾기
  const criticalPaths = allPaths
    .filter(p => p.duration === maxDuration)
    .map(p => p.path);

  // 모든 크리티컬 패스에 속한 노드들 수집
  const allPathNodes = new Set<string>();
  criticalPaths.forEach(path => {
    path.forEach(nodeId => allPathNodes.add(nodeId));
  });

  return {
    paths: criticalPaths,
    totalDuration: maxDuration,
    allPathNodes
  };
}

/**
 * 여러 크리티컬 패스들을 그룹화합니다.
 * 각 노드가 몇 개의 크리티컬 패스에 속하는지 계산합니다.
 */
export function groupCriticalPaths(result: CriticalPathResult): Map<string, number> {
  const nodePathCount = new Map<string, number>();

  result.paths.forEach(path => {
    path.forEach(nodeId => {
      nodePathCount.set(nodeId, (nodePathCount.get(nodeId) || 0) + 1);
    });
  });

  return nodePathCount;
}
