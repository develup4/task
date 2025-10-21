import { create } from 'zustand';
import { L5Task, L6Task, ProcessedData } from '@/types/task';

export type ViewMode = 'l5-all' | 'l5-filtered' | 'l6-detail';

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

  // 액션
  setProcessedData: (data: ProcessedData) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedL5: (taskId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedTasks: (tasks: Set<string>) => void;
  
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
  viewMode: 'l5-all',
  selectedL5: null,
  searchQuery: '',
  highlightedTasks: new Set(),
  visibleL4Categories: new Set(),
  visibleTeams: new Set(),

  // 액션
  setProcessedData: (data) => {
    // 데이터가 설정될 때 모든 L4 카테고리와 작성팀을 기본적으로 표시
    const categories = new Set<string>();
    const teams = new Set<string>();
    data.l5Tasks.forEach(task => {
      categories.add(task.l4Category);
      if (task.작성팀) teams.add(task.작성팀);
    });
    set({ processedData: data, visibleL4Categories: categories, visibleTeams: teams });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedL5: (taskId) => set({ selectedL5: taskId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setHighlightedTasks: (tasks) => set({ highlightedTasks: tasks }),
  
  // L4 카테고리 필터 액션
  toggleL4Category: (category) => set((state) => {
    const newVisible = new Set(state.visibleL4Categories);
    if (newVisible.has(category)) {
      newVisible.delete(category);
    } else {
      newVisible.add(category);
    }
    return { visibleL4Categories: newVisible };
  }),

  showAllL4Categories: () => set((state) => {
    if (!state.processedData) return state;
    const allCategories = new Set<string>();
    state.processedData.l5Tasks.forEach(task => allCategories.add(task.l4Category));
    return { visibleL4Categories: allCategories };
  }),

  hideAllL4Categories: () => set({ visibleL4Categories: new Set() }),

  getL4Categories: () => {
    const { processedData } = get();
    if (!processedData) return [];
    const categories = new Set<string>();
    processedData.l5Tasks.forEach(task => categories.add(task.l4Category));
    return Array.from(categories).sort();
  },

  // 작성팀 필터 액션
  toggleTeam: (team) => set((state) => {
    const newVisible = new Set(state.visibleTeams);
    if (newVisible.has(team)) {
      newVisible.delete(team);
    } else {
      newVisible.add(team);
    }
    return { visibleTeams: newVisible };
  }),

  showAllTeams: () => set((state) => {
    if (!state.processedData) return state;
    const allTeams = new Set<string>();
    state.processedData.l5Tasks.forEach(task => {
      if (task.작성팀) allTeams.add(task.작성팀);
    });
    return { visibleTeams: allTeams };
  }),

  hideAllTeams: () => set({ visibleTeams: new Set() }),

  getTeams: () => {
    const { processedData } = get();
    if (!processedData) return [];
    const teams = new Set<string>();
    processedData.l5Tasks.forEach(task => {
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
    const { processedData, selectedL5, viewMode, visibleL4Categories, visibleTeams } = get();
    if (!processedData) return [];

    let allTasks = Array.from(processedData.l5Tasks.values());

    if (viewMode === 'l5-all') {
      // L5-all 모드에서만 L4 카테고리 및 작성팀 필터 적용
      allTasks = allTasks.filter(task =>
        visibleL4Categories.has(task.l4Category) &&
        (!task.작성팀 || visibleTeams.has(task.작성팀))
      );

      // L4 카테고리 필터로 인해 선후관계가 끊긴 노드 제거
      const visibleTaskIds = new Set(allTasks.map(t => t.id));

      return allTasks.filter(task => {
        // 선행 노드가 있는데 모두 필터링된 경우
        const hasVisiblePredecessor = task.predecessors.length === 0 ||
          task.predecessors.some(predId => visibleTaskIds.has(predId));

        // 후행 노드가 있는데 모두 필터링된 경우
        const hasVisibleSuccessor = task.successors.length === 0 ||
          task.successors.some(succId => visibleTaskIds.has(succId));

        // 선행 또는 후행 중 하나라도 연결이 있어야 표시
        // 단, 선행/후행이 둘 다 없는 고립된 노드는 표시
        if (task.predecessors.length === 0 && task.successors.length === 0) {
          return true; // 고립된 노드는 표시
        }

        return hasVisiblePredecessor && hasVisibleSuccessor;
      });
    }

    if (viewMode === 'l5-filtered' && selectedL5) {
      // L5-filtered 모드에서는 L4 카테고리 필터를 무시하고 모든 관련 노드 표시
      const selected = processedData.l5Tasks.get(selectedL5);
      if (!selected) return allTasks;

      // 선택된 노드와 직접 연결된 선행/후행 노드만 반환
      const relatedIds = new Set<string>([selectedL5]);

      // 직접 선행 노드들만 추가 (재귀 없음)
      selected.predecessors.forEach(predId => {
        relatedIds.add(predId);
      });

      // 직접 후행 노드들만 추가 (재귀 없음)
      selected.successors.forEach(succId => {
        relatedIds.add(succId);
      });

      return allTasks.filter(task => relatedIds.has(task.id));
    }

    return allTasks;
  },

  getL6TasksForL5: (l5Id) => {
    const { processedData } = get();
    if (!processedData) return [];

    return Array.from(processedData.l6Tasks.values()).filter(
      task => task.l5Parent === l5Id
    );
  },
}));
