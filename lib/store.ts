import { create } from "zustand";
import { L5Task, L6Task, ProcessedData } from "@/types/task";

export type ViewMode = "l5-all" | "l5-filtered" | "l6-detail";

interface AppState {
  // 데이터
  processedData: ProcessedData | null;

  // 뷰 모드
  viewMode: ViewMode;
  selectedL5: string | null;

  // 필터링 및 검색
  searchQuery: string;
  highlightedTasks: Set<string>;

  // L4 카테고리 필터
  visibleL4Categories: Set<string>;

  // 작성팀 필터
  visibleTeams: Set<string>;

  // L5 filtered 모드의 MM 합계
  filteredMM: number;

  // L5별 최대 필요인력 맵
  l5MaxHeadcountMap: Map<string, number>;

  // 툴팁 표시 여부
  showTooltips: boolean;

  // 액션
  setProcessedData: (data: ProcessedData) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedL5: (taskId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedTasks: (tasks: Set<string>) => void;
  setFilteredMM: (mm: number) => void;
  setL5MaxHeadcount: (l5Id: string, headcount: number) => void;
  toggleTooltips: () => void;

  // L4 카테고리 필터 액션
  toggleL4Category: (category: string) => void;
  showAllL4Categories: () => void;
  hideAllL4Categories: () => void;
  getL4Categories: () => string[];

  // 작성팀 필터 액션
  toggleTeam: (team: string) => void;
  showAllTeams: () => void;
  hideAllTeams: () => void;
  getTeams: () => string[];

  // 유틸리티
  getL5Task: (id: string) => L5Task | undefined;
  getL6Task: (id: string) => L6Task | undefined;
  getFilteredL5Tasks: () => L5Task[];
  getL6TasksForL5: (l5Id: string) => L6Task[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // 초기 상태
  processedData: null,
  viewMode: "l5-all",
  selectedL5: null,
  searchQuery: "",
  highlightedTasks: new Set(),
  visibleL4Categories: new Set(),
  visibleTeams: new Set(),
  filteredMM: 0,
  l5MaxHeadcountMap: new Map(),
  showTooltips: true,

  // 액션
  setProcessedData: (data) => {
    // 데이터가 설정될 때 모든 L4 카테고리와 작성팀을 기본적으로 표시
    const categories = data.l4Categories; // excelParser에서 이미 수집된 카테고리 사용 (Unspecified 포함)
    const teams = new Set<string>();
    data.l5Tasks.forEach((task) => {
      if (task.작성팀) teams.add(task.작성팀);
    });
    set({
      processedData: data,
      visibleL4Categories: categories,
      visibleTeams: teams,
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedL5: (taskId) => set({ selectedL5: taskId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setHighlightedTasks: (tasks) => set({ highlightedTasks: tasks }),

  setFilteredMM: (mm) => set({ filteredMM: mm }),

  setL5MaxHeadcount: (l5Id, headcount) =>
    set((state) => {
      const newMap = new Map(state.l5MaxHeadcountMap);
      newMap.set(l5Id, headcount);
      return { l5MaxHeadcountMap: newMap };
    }),

  toggleTooltips: () => set((state) => ({ showTooltips: !state.showTooltips })),

  // L4 카테고리 필터 액션
  toggleL4Category: (category) =>
    set((state) => {
      const newVisible = new Set(state.visibleL4Categories);
      if (newVisible.has(category)) {
        newVisible.delete(category);
      } else {
        newVisible.add(category);
      }
      return { visibleL4Categories: newVisible };
    }),

  showAllL4Categories: () =>
    set((state) => {
      if (!state.processedData) return state;
      return { visibleL4Categories: state.processedData.l4Categories };
    }),

  hideAllL4Categories: () => set({ visibleL4Categories: new Set() }),

  getL4Categories: () => {
    const { processedData } = get();
    if (!processedData) return [];
    return Array.from(processedData.l4Categories).sort();
  },

  // 작성팀 필터 액션
  toggleTeam: (team) =>
    set((state) => {
      const newVisible = new Set(state.visibleTeams);
      if (newVisible.has(team)) {
        newVisible.delete(team);
      } else {
        newVisible.add(team);
      }
      return { visibleTeams: newVisible };
    }),

  showAllTeams: () =>
    set((state) => {
      if (!state.processedData) return state;
      const allTeams = new Set<string>();
      state.processedData.l5Tasks.forEach((task) => {
        if (task.작성팀) allTeams.add(task.작성팀);
      });
      return { visibleTeams: allTeams };
    }),

  hideAllTeams: () => set({ visibleTeams: new Set() }),

  getTeams: () => {
    const { processedData } = get();
    if (!processedData) return [];
    const teams = new Set<string>();
    processedData.l5Tasks.forEach((task) => {
      if (task.작성팀) teams.add(task.작성팀);
    });
    return Array.from(teams).sort();
  },

  // 유틸리티
  getL5Task: (id) => {
    const { processedData } = get();
    return processedData?.l5Tasks.get(id);
  },

  getL6Task: (id) => {
    const { processedData } = get();
    return processedData?.l6Tasks.get(id);
  },

  getFilteredL5Tasks: () => {
    const {
      processedData,
      selectedL5,
      viewMode,
      visibleL4Categories,
      visibleTeams,
    } = get();
    if (!processedData) return [];

    let allTasks = Array.from(processedData.l5Tasks.values());

    if (viewMode === "l5-all") {
      // L5-all 모드에서만 L4 카테고리 및 작성팀 필터 적용
      allTasks = allTasks.filter(
        (task) =>
          visibleL4Categories.has(task.l4Category) &&
          (!task.작성팀 || visibleTeams.has(task.작성팀)),
      );

      // L4 카테고리 필터로 인해 선후관계가 끊긴 노드 제거
      const visibleTaskIds = new Set(allTasks.map((t) => t.id));

      return allTasks.filter((task) => {
        // 선행 노드가 있는데 모두 필터링된 경우
        const hasVisiblePredecessor =
          task.predecessors.length === 0 ||
          task.predecessors.some((predId) => visibleTaskIds.has(predId));

        // 후행 노드가 있는데 모두 필터링된 경우
        const hasVisibleSuccessor =
          task.successors.length === 0 ||
          task.successors.some((succId) => visibleTaskIds.has(succId));

        // 선행 또는 후행 중 하나라도 연결이 있어야 표시
        // 단, 선행/후행이 둘 다 없는 고립된 노드는 표시
        if (task.predecessors.length === 0 && task.successors.length === 0) {
          return true; // 고립된 노드는 표시
        }

        return hasVisiblePredecessor && hasVisibleSuccessor;
      });
    }

    if (viewMode === "l5-filtered" && selectedL5) {
      // L5-filtered 모드에서는 선택된 노드와 모든 선행 노드만 표시 (후행 제외)
      const selected = processedData.l5Tasks.get(selectedL5);
      if (!selected) return allTasks;

      // 선택된 노드와 모든 선행 노드를 재귀적으로 수집
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

      // L4 카테고리 필터 적용
      return allTasks.filter(
        (task) =>
          predecessorIds.has(task.id) &&
          visibleL4Categories.has(task.l4Category),
      );
    }

    return allTasks;
  },

  getL6TasksForL5: (l5Id) => {
    const { processedData } = get();
    if (!processedData) return [];

    return Array.from(processedData.l6Tasks.values()).filter(
      (task) => task.l5Parent === l5Id,
    );
  },
}));
