import * as XLSX from 'xlsx';
import { TaskData, L5Task, L6Task, ProcessedData, ValidationError } from '@/types/task';

// [Sensor], [Sensor]_ 같은 prefix 제거
const removePrefixes = (text: string): string => {
  return text.replace(/^\[.*?\]_?/g, '').trim();
};

// '|'로 구분된 문자열을 배열로 변환
const splitByPipe = (text: string | undefined): string[] => {
  if (!text) return [];
  return text.split('|').map(s => s.trim()).filter(s => s);
};

// 대소문자 무시하고 task ID 찾기 (case mismatch 감지)
const findTaskIdCaseInsensitive = (
  targetId: string,
  tasks: Map<string, L5Task | L6Task>
): { foundId: string | null; hasCaseMismatch: boolean } => {
  // 정확한 매칭 시도
  if (tasks.has(targetId)) {
    return { foundId: targetId, hasCaseMismatch: false };
  }

  // 대소문자 무시 매칭
  const lowerTarget = targetId.toLowerCase();
  for (const [taskId] of tasks) {
    if (taskId.toLowerCase() === lowerTarget) {
      return { foundId: taskId, hasCaseMismatch: true };
    }
  }

  return { foundId: null, hasCaseMismatch: false };
};

// 양방향 연결 감지
const detectCycles = (tasks: Map<string, L5Task | L6Task>): void => {
  tasks.forEach(task => {
    const hasBidirectional = task.successors.some(succId => {
      const successor = tasks.get(succId);
      return successor?.successors.includes(task.id);
    });
    if (hasBidirectional) {
      task.hasCycle = true;
    }
  });
};

// 최종 노드(후행이 없는 노드)의 누적 MM 계산
const calculateCumulativeMM = (tasks: Map<string, L5Task>): void => {
  const visited = new Set<string>();

  const dfs = (taskId: string, currentMM: number): number => {
    if (visited.has(taskId)) return currentMM;
    visited.add(taskId);

    const task = tasks.get(taskId);
    if (!task) return currentMM;

    const totalMM = currentMM + task.MM;

    if (task.successors.length === 0) {
      // 최종 노드
      task.isFinalNode = true;
      task.cumulativeMM = totalMM;
      return totalMM;
    }

    // 후행 노드들 중 최대 누적 MM
    let maxMM = totalMM;
    task.successors.forEach(succId => {
      const succMM = dfs(succId, totalMM);
      maxMM = Math.max(maxMM, succMM);
    });

    return maxMM;
  };

  // 선행이 없는 시작 노드들부터 시작
  tasks.forEach(task => {
    if (task.predecessors.length === 0) {
      dfs(task.id, 0);
    }
  });
};

export const parseExcelFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 헤더를 기준으로 JSON 변환
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const l5Tasks = new Map<string, L5Task>();
        const l6Tasks = new Map<string, L6Task>();
        const l4Categories = new Set<string>();

        rawData.forEach((row) => {
          const taskData: TaskData = {
            작성팀: row['작성팀 (일자)'],
            Level: row['Level (*)'] as any,
            L1: row['L1'],
            L2: row['L2'],
            L3: row['L3'],
            L4: row['L4'],
            L5: row['L5'],
            L6: row['L6'],
            필요인력: Number(row['필요인력']) || 0,
            필요기간: Number(row['필요기간']) || 0,
            MM: Number(row['MM']) || 0,
            정의: row['정의'],
            '프로세스 오너부서(L5)': row['프로세스 오너부서(L5)'],
            '산출물(L5)': row['산출물(L5)'],
            '선행 프로세스(L5)': row['선행 프로세스(L5)'],
            '후행 프로세스(L5)': row['후행 프로세스(L5)'],
            '준수지표(L5)': row['준수지표(L5)'],
            '소요기간(L5)': row['소요기간(L5)'],
            '수행주기(L5)': row['수행주기(L5)'],
            '참여(L5)': row['참여(L5)'],
            '바로가기 URL(L5)': row['바로가기 URL(L5)'],
            '업무담당부서(L6)': row['업무담당부서(L6)'],
            '참여부서(L6)': row['참여부서(L6)'],
            시스템: row['시스템'],
            '작업방식(L6)': row['작업방식(L6)'],
            '후행 액티비티(L6)': row['후행 액티비티(L6)'],
            'L6의 선행 L5': row['L6의 선행 L5'],
            'L6의 후행 L5': row['L6의 후행 L5'],
            '수행 milestone': row['수행 milestone'],
          };

          // L4 카테고리 추가
          if (taskData.L4) {
            l4Categories.add(removePrefixes(taskData.L4));
          }

          // L5 Task 처리
          if (taskData.Level === 'L5' && taskData.L5) {
            const l5Id = taskData.L5;

            if (!l5Tasks.has(l5Id)) {
              l5Tasks.set(l5Id, {
                id: l5Id,
                name: removePrefixes(taskData.L5),
                l4Category: removePrefixes(taskData.L4),
                작성팀: taskData.작성팀,
                필요인력: taskData.필요인력,
                필요기간: taskData.필요기간,
                MM: taskData.MM,
                정의: taskData.정의,
                '프로세스 오너부서(L5)': taskData['프로세스 오너부서(L5)'],
                '산출물(L5)': taskData['산출물(L5)'],
                predecessors: splitByPipe(taskData['선행 프로세스(L5)']),
                successors: splitByPipe(taskData['후행 프로세스(L5)']),
                l6Tasks: [],
              });
            }
          }

          // L6 Task 처리
          if (taskData.Level === 'L6' && taskData.L6 && taskData.L5) {
            const l6Id = `${taskData.L5}::${taskData.L6}`;
            const l5Parent = taskData.L5;

            const l6Task: L6Task = {
              id: l6Id,
              name: removePrefixes(taskData.L6),
              l4Category: removePrefixes(taskData.L4),
              l5Parent,
              필요인력: taskData.필요인력,
              필요기간: taskData.필요기간,
              MM: taskData.MM,
              정의: taskData.정의,
              '업무담당부서(L6)': taskData['업무담당부서(L6)'],
              '참여부서(L6)': taskData['참여부서(L6)'],
              시스템: taskData.시스템,
              '작업방식(L6)': taskData['작업방식(L6)'],
              predecessors: [],
              successors: splitByPipe(taskData['후행 액티비티(L6)']).map(
                name => `${l5Parent}::${name}`
              ),
              '선행 L5': splitByPipe(taskData['L6의 선행 L5']),
              '후행 L5': splitByPipe(taskData['L6의 후행 L5']),
            };

            l6Tasks.set(l6Id, l6Task);

            // L5에 L6 추가
            const l5Task = l5Tasks.get(l5Parent);
            if (l5Task) {
              l5Task.l6Tasks.push(l6Task);
            }
          }
        });

        // L5 선행/후행 대소문자 정규화 및 case mismatch 검출
        const caseMismatchErrors: ValidationError[] = [];

        l5Tasks.forEach(task => {
          // Predecessors 정규화
          const normalizedPredecessors: string[] = [];
          task.predecessors.forEach(predId => {
            const { foundId, hasCaseMismatch } = findTaskIdCaseInsensitive(predId, l5Tasks);
            if (foundId) {
              normalizedPredecessors.push(foundId);
              if (hasCaseMismatch) {
                caseMismatchErrors.push({
                  type: 'case_mismatch',
                  sourceTask: task.id,
                  sourceLevel: 'L5',
                  relatedTask: foundId,
                  description: `L5 프로세스 "${task.name}"의 선행 프로세스 입력 "${predId}"의 대소문자가 실제 프로세스 ID "${foundId}"와 다릅니다.`
                });
              }
            } else {
              // 매칭되지 않은 ID는 그대로 유지 (누락된 프로세스로 처리됨)
              normalizedPredecessors.push(predId);
            }
          });
          task.predecessors = normalizedPredecessors;

          // Successors 정규화
          const normalizedSuccessors: string[] = [];
          task.successors.forEach(succId => {
            const { foundId, hasCaseMismatch } = findTaskIdCaseInsensitive(succId, l5Tasks);
            if (foundId) {
              normalizedSuccessors.push(foundId);
              if (hasCaseMismatch) {
                caseMismatchErrors.push({
                  type: 'case_mismatch',
                  sourceTask: task.id,
                  sourceLevel: 'L5',
                  relatedTask: foundId,
                  description: `L5 프로세스 "${task.name}"의 후행 프로세스 입력 "${succId}"의 대소문자가 실제 프로세스 ID "${foundId}"와 다릅니다.`
                });
              }
            } else {
              // 매칭되지 않은 ID는 그대로 유지 (누락된 프로세스로 처리됨)
              normalizedSuccessors.push(succId);
            }
          });
          task.successors = normalizedSuccessors;
        });

        // L6 선행/후행 대소문자 정규화 및 case mismatch 검출
        l6Tasks.forEach(task => {
          // Successors 정규화 (L6는 successors만 엑셀에 입력됨)
          const normalizedSuccessors: string[] = [];
          task.successors.forEach(succId => {
            const { foundId, hasCaseMismatch } = findTaskIdCaseInsensitive(succId, l6Tasks);
            if (foundId) {
              normalizedSuccessors.push(foundId);
              if (hasCaseMismatch) {
                caseMismatchErrors.push({
                  type: 'case_mismatch',
                  sourceTask: task.id,
                  sourceLevel: 'L6',
                  relatedTask: foundId,
                  description: `L6 액티비티 "${task.name}"의 후행 액티비티 입력 "${succId}"의 대소문자가 실제 액티비티 ID "${foundId}"와 다릅니다.`
                });
              }
            } else {
              // 매칭되지 않은 ID는 그대로 유지 (누락된 액티비티로 처리됨)
              normalizedSuccessors.push(succId);
            }
          });
          task.successors = normalizedSuccessors;
        });

        // L6의 predecessors 계산 (successors의 역방향)
        l6Tasks.forEach(task => {
          task.successors.forEach(succId => {
            const succTask = l6Tasks.get(succId);
            if (succTask && !succTask.predecessors.includes(task.id)) {
              succTask.predecessors.push(task.id);
            }
          });
        });

        // L5 각각의 MM을 L6들의 합계로 업데이트
        l5Tasks.forEach(l5Task => {
          if (l5Task.l6Tasks.length > 0) {
            l5Task.필요인력 = l5Task.l6Tasks.reduce((sum, l6) => sum + l6.필요인력, 0);
            l5Task.필요기간 = l5Task.l6Tasks.reduce((sum, l6) => sum + l6.필요기간, 0);
            l5Task.MM = l5Task.l6Tasks.reduce((sum, l6) => sum + l6.MM, 0);
          }
        });

        // 양방향 연결 감지
        detectCycles(l5Tasks);
        detectCycles(l6Tasks);

        // 누적 MM 계산
        calculateCumulativeMM(l5Tasks);

        // 누락된 프로세스 감지 및 추가
        const errors: ValidationError[] = [...caseMismatchErrors];

        // 양방향 오류 수집 (L5)
        l5Tasks.forEach(task => {
          if (task.hasCycle) {
            // 양방향 연결된 task 찾기
            task.successors.forEach(succId => {
              const successor = l5Tasks.get(succId);
              if (successor?.successors.includes(task.id)) {
                // 중복 방지를 위해 id가 작은 쪽에서만 에러 추가
                if (task.id < succId) {
                  errors.push({
                    type: 'bidirectional_error',
                    sourceTask: task.id,
                    sourceLevel: 'L5',
                    relatedTask: succId,
                    description: `L5 프로세스 "${task.name}"와 "${successor.name}"가 서로 선행/후행 관계로 연결되어 있습니다.`
                  });
                }
              }
            });
          }
        });

        // 양방향 오류 수집 (L6)
        l6Tasks.forEach(task => {
          if (task.hasCycle) {
            // 양방향 연결된 task 찾기
            task.successors.forEach(succId => {
              const successor = l6Tasks.get(succId);
              if (successor?.successors.includes(task.id)) {
                // 중복 방지를 위해 id가 작은 쪽에서만 에러 추가
                if (task.id < succId) {
                  errors.push({
                    type: 'bidirectional_error',
                    sourceTask: task.id,
                    sourceLevel: 'L6',
                    relatedTask: succId,
                    description: `L6 액티비티 "${task.name}"와 "${successor.name}"가 서로 선행/후행 관계로 연결되어 있습니다.`
                  });
                }
              }
            });
          }
        });

        // Self-loop 오류 수집 및 제거 (L5)
        l5Tasks.forEach(task => {
          // 자기 자신을 선행/후행으로 가지고 있는지 체크
          const hasSelfLoop = task.predecessors.includes(task.id) || task.successors.includes(task.id);

          if (hasSelfLoop) {
            errors.push({
              type: 'self_loop_error',
              sourceTask: task.id,
              sourceLevel: 'L5',
              description: `L5 프로세스 "${task.name}"가 자기 자신을 선행 또는 후행 프로세스로 참조하고 있습니다.`
            });

            // Self-loop 제거
            task.predecessors = task.predecessors.filter(id => id !== task.id);
            task.successors = task.successors.filter(id => id !== task.id);
          }
        });

        // Self-loop 오류 수집 및 제거 (L6)
        l6Tasks.forEach(task => {
          // 자기 자신을 선행/후행으로 가지고 있는지 체크
          const hasSelfLoop = task.predecessors.includes(task.id) || task.successors.includes(task.id);

          if (hasSelfLoop) {
            errors.push({
              type: 'self_loop_error',
              sourceTask: task.id,
              sourceLevel: 'L6',
              description: `L6 액티비티 "${task.name}"가 자기 자신을 선행 또는 후행 액티비티로 참조하고 있습니다.`
            });

            // Self-loop 제거
            task.predecessors = task.predecessors.filter(id => id !== task.id);
            task.successors = task.successors.filter(id => id !== task.id);
          }
        });

        // L5 프로세스의 선행/후행 검증
        l5Tasks.forEach(task => {
          // 선행 프로세스 체크
          task.predecessors.forEach(predId => {
            if (!l5Tasks.has(predId)) {
              // 누락된 선행 프로세스 발견
              errors.push({
                type: 'missing_predecessor',
                sourceTask: task.id,
                sourceLevel: 'L5',
                missingTask: predId,
                description: `L5 프로세스 "${task.name}"의 선행 프로세스 "${predId}"를 찾을 수 없습니다.`
              });

              // Unspecified 카테고리로 누락된 노드 추가
              if (!l5Tasks.has(predId)) {
                l5Tasks.set(predId, {
                  id: predId,
                  name: removePrefixes(predId),
                  l4Category: 'Unspecified',
                  필요인력: 0,
                  필요기간: 0,
                  MM: 0,
                  predecessors: [],
                  successors: [task.id],
                  l6Tasks: [],
                });
                l4Categories.add('Unspecified');
              }
            }
          });

          // 후행 프로세스 체크
          task.successors.forEach(succId => {
            if (!l5Tasks.has(succId)) {
              // 누락된 후행 프로세스 발견
              errors.push({
                type: 'missing_successor',
                sourceTask: task.id,
                sourceLevel: 'L5',
                missingTask: succId,
                description: `L5 프로세스 "${task.name}"의 후행 프로세스 "${succId}"를 찾을 수 없습니다.`
              });

              // Unspecified 카테고리로 누락된 노드 추가
              if (!l5Tasks.has(succId)) {
                l5Tasks.set(succId, {
                  id: succId,
                  name: removePrefixes(succId),
                  l4Category: 'Unspecified',
                  필요인력: 0,
                  필요기간: 0,
                  MM: 0,
                  predecessors: [task.id],
                  successors: [],
                  l6Tasks: [],
                });
                l4Categories.add('Unspecified');
              }
            }
          });
        });

        // Unspecified 노드의 선행/후행 관계 업데이트
        l5Tasks.forEach(task => {
          // 이 task의 선행들 중에 Unspecified 노드가 있으면, 그 Unspecified 노드의 successors에 이 task 추가
          task.predecessors.forEach(predId => {
            const predTask = l5Tasks.get(predId);
            if (predTask && predTask.l4Category === 'Unspecified') {
              if (!predTask.successors.includes(task.id)) {
                predTask.successors.push(task.id);
              }
            }
          });

          // 이 task의 후행들 중에 Unspecified 노드가 있으면, 그 Unspecified 노드의 predecessors에 이 task 추가
          task.successors.forEach(succId => {
            const succTask = l5Tasks.get(succId);
            if (succTask && succTask.l4Category === 'Unspecified') {
              if (!succTask.predecessors.includes(task.id)) {
                succTask.predecessors.push(task.id);
              }
            }
          });
        });

        // L5 선행/후행 입력 불일치 검증 (동기화 전에 먼저 검증)
        l5Tasks.forEach(task => {
          // 선행이 비어있는데 다른 프로세스의 후행으로 참조되는 경우
          if (task.predecessors.length === 0) {
            // 다른 프로세스들 중에서 이 task를 후행으로 가지는 것이 있는지 확인
            l5Tasks.forEach(otherTask => {
              if (otherTask.id !== task.id && otherTask.successors.includes(task.id)) {
                errors.push({
                  type: 'empty_predecessor_but_referenced',
                  sourceTask: task.id,
                  sourceLevel: 'L5',
                  relatedTask: otherTask.id,
                  description: `L5 프로세스 "${task.name}"의 선행 프로세스가 비어있지만, "${otherTask.name}"의 후행 프로세스로 참조되고 있습니다.`
                });
              }
            });
          }

          // 후행이 비어있는데 다른 프로세스의 선행으로 참조되는 경우
          if (task.successors.length === 0) {
            // 다른 프로세스들 중에서 이 task를 선행으로 가지는 것이 있는지 확인
            l5Tasks.forEach(otherTask => {
              if (otherTask.id !== task.id && otherTask.predecessors.includes(task.id)) {
                errors.push({
                  type: 'empty_successor_but_referenced',
                  sourceTask: task.id,
                  sourceLevel: 'L5',
                  relatedTask: otherTask.id,
                  description: `L5 프로세스 "${task.name}"의 후행 프로세스가 비어있지만, "${otherTask.name}"의 선행 프로세스로 참조되고 있습니다.`
                });
              }
            });
          }
        });

        // L6 프로세스의 선행/후행 검증
        l6Tasks.forEach(task => {
          // 선행 액티비티 체크
          task.predecessors.forEach(predId => {
            if (!l6Tasks.has(predId)) {
              errors.push({
                type: 'missing_predecessor',
                sourceTask: task.id,
                sourceLevel: 'L6',
                missingTask: predId,
                description: `L6 액티비티 "${task.name}"의 선행 액티비티 "${predId}"를 찾을 수 없습니다.`
              });
            }
          });

          // 후행 액티비티 체크
          task.successors.forEach(succId => {
            if (!l6Tasks.has(succId)) {
              errors.push({
                type: 'missing_successor',
                sourceTask: task.id,
                sourceLevel: 'L6',
                missingTask: succId,
                description: `L6 액티비티 "${task.name}"의 후행 액티비티 "${succId}"를 찾을 수 없습니다.`
              });
            }
          });

          // 선행 L5 체크
          task['선행 L5']?.forEach(l5Id => {
            if (!l5Tasks.has(l5Id)) {
              errors.push({
                type: 'missing_l5_reference',
                sourceTask: task.id,
                sourceLevel: 'L6',
                missingTask: l5Id,
                description: `L6 액티비티 "${task.name}"의 선행 L5 "${l5Id}"를 찾을 수 없습니다.`
              });
            }
          });

          // 후행 L5 체크
          task['후행 L5']?.forEach(l5Id => {
            if (!l5Tasks.has(l5Id)) {
              errors.push({
                type: 'missing_l5_reference',
                sourceTask: task.id,
                sourceLevel: 'L6',
                missingTask: l5Id,
                description: `L6 액티비티 "${task.name}"의 후행 L5 "${l5Id}"를 찾을 수 없습니다.`
              });
            }
          });
        });

        // L6 선행/후행 입력 불일치 검증 (동기화 전에 먼저 검증)
        l6Tasks.forEach(task => {
          // 선행이 비어있는데 다른 액티비티의 후행으로 참조되는 경우
          if (task.predecessors.length === 0) {
            // 다른 액티비티들 중에서 이 task를 후행으로 가지는 것이 있는지 확인
            l6Tasks.forEach(otherTask => {
              if (otherTask.id !== task.id && otherTask.successors.includes(task.id)) {
                errors.push({
                  type: 'empty_predecessor_but_referenced',
                  sourceTask: task.id,
                  sourceLevel: 'L6',
                  relatedTask: otherTask.id,
                  description: `L6 액티비티 "${task.name}"의 선행 액티비티가 비어있지만, "${otherTask.name}"의 후행 액티비티로 참조되고 있습니다.`
                });
              }
            });
          }

          // 후행이 비어있는데 다른 액티비티의 선행으로 참조되는 경우
          if (task.successors.length === 0) {
            // 다른 액티비티들 중에서 이 task를 선행으로 가지는 것이 있는지 확인
            l6Tasks.forEach(otherTask => {
              if (otherTask.id !== task.id && otherTask.predecessors.includes(task.id)) {
                errors.push({
                  type: 'empty_successor_but_referenced',
                  sourceTask: task.id,
                  sourceLevel: 'L6',
                  relatedTask: otherTask.id,
                  description: `L6 액티비티 "${task.name}"의 후행 액티비티가 비어있지만, "${otherTask.name}"의 선행 액티비티로 참조되고 있습니다.`
                });
              }
            });
          }
        });

        // L5 양방향 관계 동기화 (한쪽만 입력되어도 edge 생성)
        // 검증 후에 동기화하여 그래프가 완전하게 그려지도록 함
        l5Tasks.forEach(task => {
          // A의 후행에 B가 있으면, B의 선행에 A를 추가
          task.successors.forEach(succId => {
            const succTask = l5Tasks.get(succId);
            if (succTask && !succTask.predecessors.includes(task.id)) {
              succTask.predecessors.push(task.id);
            }
          });

          // A의 선행에 B가 있으면, B의 후행에 A를 추가
          task.predecessors.forEach(predId => {
            const predTask = l5Tasks.get(predId);
            if (predTask && !predTask.successors.includes(task.id)) {
              predTask.successors.push(task.id);
            }
          });
        });

        // L6 양방향 관계 동기화 (한쪽만 입력되어도 edge 생성)
        l6Tasks.forEach(task => {
          // A의 후행에 B가 있으면, B의 선행에 A를 추가
          task.successors.forEach(succId => {
            const succTask = l6Tasks.get(succId);
            if (succTask && !succTask.predecessors.includes(task.id)) {
              succTask.predecessors.push(task.id);
            }
          });

          // A의 선행에 B가 있으면, B의 후행에 A를 추가
          task.predecessors.forEach(predId => {
            const predTask = l6Tasks.get(predId);
            if (predTask && !predTask.successors.includes(task.id)) {
              predTask.successors.push(task.id);
            }
          });
        });

        resolve({
          l5Tasks,
          l6Tasks,
          l4Categories,
          errors,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsBinaryString(file);
  });
};
