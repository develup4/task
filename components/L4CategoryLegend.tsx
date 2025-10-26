"use client";

import { useAppStore } from "@/lib/store";
import { getColorForCategory } from "@/utils/colors";

interface L4CategoryLegendProps {
  className?: string;
}

export default function L4CategoryLegend({
  className = "",
}: L4CategoryLegendProps) {
  const {
    processedData,
    visibleL4Categories,
    toggleL4Category,
    getL4Categories,
  } = useAppStore();

  if (!processedData) return null;

  const allCategories = getL4Categories();

  // Unspecified를 마지막으로 정렬
  const categories = allCategories.filter((c) => c !== "Unspecified");
  if (allCategories.includes("Unspecified")) {
    categories.push("Unspecified");
  }

  return (
    <div
      className={`bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-3 ${className}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((category) => {
          const colors = getColorForCategory(category);
          const isVisible = visibleL4Categories.has(category);
          const isUnspecified = category === "Unspecified";

          return (
            <button
              key={category}
              onClick={() => toggleL4Category(category)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full
                font-medium text-sm transition-all duration-200
                ${
                  isVisible
                    ? "shadow-md hover:shadow-lg transform hover:scale-105"
                    : "opacity-40 hover:opacity-60 shadow-sm"
                }
                ${
                  isUnspecified
                    ? "border-2 border-dashed border-yellow-500"
                    : "border-2"
                }
              `}
              style={{
                backgroundColor: isVisible ? colors.bg : "#f3f4f6",
                borderColor: isVisible ? colors.border : "#d1d5db",
                color: isVisible ? colors.text : "#6b7280",
              }}
            >
              {/* 색상 점 */}
              <div
                className={`w-3 h-3 rounded-full ${isVisible ? "ring-2 ring-white" : ""}`}
                style={{
                  backgroundColor: colors.border,
                }}
              />

              {/* 카테고리 이름 */}
              <span className="whitespace-nowrap">
                {category.replace(/^\[.*?\]/, "")}
              </span>

              {/* Unspecified 표시 */}
              {isUnspecified && (
                <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full font-semibold">
                  오류
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
