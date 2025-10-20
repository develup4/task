'use client';

import { useAppStore } from '@/lib/store';
import { getColorForCategory } from '@/utils/colors';

interface L4CategoryLegendProps {
  className?: string;
}

export default function L4CategoryLegend({ className = '' }: L4CategoryLegendProps) {
  const {
    processedData,
    visibleL4Categories,
    toggleL4Category,
    showAllL4Categories,
    hideAllL4Categories,
    getL4Categories,
  } = useAppStore();

  if (!processedData) return null;

  const categories = getL4Categories();
  const visibleCount = visibleL4Categories.size;
  const totalCount = categories.length;

  // 각 카테고리의 태스크 수 계산
  const getCategoryCount = (category: string): number => {
    return Array.from(processedData.l5Tasks.values()).filter(
      task => task.l4Category === category
    ).length;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">L4 카테고리 필터</h3>
        <div className="text-xs text-gray-500">
          {visibleCount}/{totalCount} 표시
        </div>
      </div>

      {/* 전체 토글 버튼 */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={showAllL4Categories}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          전체 보기
        </button>
        <button
          onClick={hideAllL4Categories}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          전체 숨기기
        </button>
      </div>

      {/* 카테고리 목록 */}
      <div className="space-y-2">
        {categories.map((category) => {
          const colors = getColorForCategory(category);
          const isVisible = visibleL4Categories.has(category);
          const count = getCategoryCount(category);

          return (
            <div
              key={category}
              onClick={() => toggleL4Category(category)}
              className={`flex items-center p-2 rounded cursor-pointer transition-all ${
                isVisible 
                  ? 'hover:bg-gray-50' 
                  : 'opacity-50 hover:bg-gray-50'
              }`}
            >
              {/* 색상 표시 */}
              <div
                className={`w-4 h-4 rounded mr-3 border-2 transition-all ${
                  isVisible 
                    ? 'border-transparent' 
                    : 'border-gray-300 bg-gray-100 bg-opacity-50'
                }`}
                style={{
                  backgroundColor: isVisible ? colors.border : undefined,
                  backgroundImage: !isVisible 
                    ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, #ccc 2px, #ccc 4px)'
                    : undefined,
                }}
              />

              {/* 카테고리 이름 */}
              <div className="flex-1 text-sm text-gray-700">
                {category.replace(/^\[.*?\]/, '')}
              </div>

              {/* 태스크 수 */}
              <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* 통계 정보 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          표시된 태스크: {Array.from(processedData.l5Tasks.values()).filter(
            task => visibleL4Categories.has(task.l4Category)
          ).length}/{processedData.l5Tasks.size}
        </div>
      </div>
    </div>
  );
}