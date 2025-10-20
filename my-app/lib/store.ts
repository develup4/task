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

  // 액션
  setProcessedData: (data: ProcessedData) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedL5: (taskId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedTasks: (tasks: Set<string>) => void;

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

  // 액션
  setProcessedData: (data) => set({ processedData: data }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedL5: (taskId) => set({ selectedL5: taskId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setHighlightedTasks: (tasks) => set({ highlightedTasks: tasks }),

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
    const { processedData, selectedL5, viewMode } = get();
    if (!processedData) return [];

    const allTasks = Array.from(processedData.l5Tasks.values());

    if (viewMode === 'l5-all') {
      return allTasks;
    }

    if (viewMode === 'l5-filtered' && selectedL5) {
      const selected = processedData.l5Tasks.get(selectedL5);
      if (!selected) return allTasks;

      // 선택된 노드와 관련된 노드들만 반환
      const relatedIds = new Set<string>([selectedL5]);

      // 선행 노드들 추가
      const addPredecessors = (taskId: string) => {
        const task = processedData.l5Tasks.get(taskId);
        if (task) {
          task.predecessors.forEach(predId => {
            if (!relatedIds.has(predId)) {
              relatedIds.add(predId);
              addPredecessors(predId);
            }
          });
        }
      };

      // 후행 노드들 추가
      const addSuccessors = (taskId: string) => {
        const task = processedData.l5Tasks.get(taskId);
        if (task) {
          task.successors.forEach(succId => {
            if (!relatedIds.has(succId)) {
              relatedIds.add(succId);
              addSuccessors(succId);
            }
          });
        }
      };

      addPredecessors(selectedL5);
      addSuccessors(selectedL5);

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
