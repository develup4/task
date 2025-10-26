export type TaskLevel = "L4" | "L5" | "L6";

export interface TaskData {
  // 기본 정보
  작성팀?: string;
  Level: TaskLevel;
  L1?: string;
  L2?: string;
  L3?: string;
  L4: string;
  L5?: string;
  L6?: string;

  // 리소스 정보
  필요인력: number;
  필요기간: number;
  MM: number;

  // 프로세스 정보
  정의?: string;

  // L5 관련 정보
  "프로세스 오너부서(L5)"?: string;
  "산출물(L5)"?: string;
  "선행 프로세스(L5)"?: string;
  "후행 프로세스(L5)"?: string;
  "준수지표(L5)"?: string;
  "소요기간(L5)"?: string;
  "수행주기(L5)"?: string;
  "참여(L5)"?: string;
  "바로가기 URL(L5)"?: string;

  // L6 관련 정보
  "업무담당부서(L6)"?: string;
  "참여부서(L6)"?: string;
  시스템?: string;
  "작업방식(L6)"?: string;
  "후행 액티비티(L6)"?: string;
  "L6의 선행 L5"?: string;
  "L6의 후행 L5"?: string;
  "수행 milestone"?: string;
}

export interface L5Task {
  id: string;
  name: string;
  l4Category: string;
  작성팀?: string;
  필요인력: number;
  필요기간: number;
  MM: number;
  정의?: string;
  "프로세스 오너부서(L5)"?: string;
  "산출물(L5)"?: string;
  "준수지표(L5)"?: string;
  "소요기간(L5)"?: string;
  "수행주기(L5)"?: string;
  "참여(L5)"?: string;
  "바로가기 URL(L5)"?: string;
  predecessors: string[];
  successors: string[];
  l6Tasks: L6Task[];
  cumulativeMM?: number; // 최종 노드까지의 누적 MM
  isFinalNode?: boolean; // 후행이 없는 최종 노드
  hasCycle?: boolean; // 양방향 연결 에러
}

export interface L6Task {
  id: string;
  name: string;
  l4Category: string;
  l5Parent: string;
  필요인력: number;
  필요기간: number;
  MM: number;
  정의?: string;
  "업무담당부서(L6)"?: string;
  "참여부서(L6)"?: string;
  시스템?: string;
  "작업방식(L6)"?: string;
  predecessors: string[];
  successors: string[];
  "선행 L5"?: string[];
  "후행 L5"?: string[];
  hasCycle?: boolean;
}

export interface ValidationError {
  type:
    | "missing_predecessor"
    | "missing_successor"
    | "bidirectional_error"
    | "self_loop_error"
    | "missing_l5_reference"
    | "mismatch_predecessor_successor"
    | "empty_predecessor_but_referenced"
    | "empty_successor_but_referenced"
    | "case_mismatch";
  sourceTask: string;
  sourceLevel: "L5" | "L6";
  missingTask?: string;
  relatedTask?: string;
  description: string;
}

export interface ProcessedData {
  l5Tasks: Map<string, L5Task>;
  l6Tasks: Map<string, L6Task>;
  l4Categories: Set<string>;
  errors: ValidationError[];
}
