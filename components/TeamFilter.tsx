"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function TeamFilter() {
  const { getTeams, visibleTeams, toggleTeam, showAllTeams, hideAllTeams } =
    useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allTeams = getTeams();
  const selectedCount = visibleTeams.size;
  const totalCount = allTeams.length;

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pl-0.5 pr-2 py-2 bg-white border-gray-300 rounded-lg hover:bg-gray-50 hover:border-sky-400 focus:outline-none focus:ring focus:ring-sky-400 focus:border-sky-400 text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <svg
          className="w-4 h-4 text-sky-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="text-gray-700 font-normal">
          Filter ({selectedCount}/{totalCount})
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform cursor-pointer ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <button
                onClick={showAllTeams}
                className="flex-1 px-3 py-1.5 text-xs bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors font-medium"
              >
                Select All
              </button>
              <button
                onClick={hideAllTeams}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {allTeams.map((team) => (
              <label
                key={team}
                className="flex items-center px-4 py-2.5 hover:bg-sky-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleTeams.has(team)}
                  onChange={() => toggleTeam(team)}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <span className="ml-3 text-sm text-gray-700">{team}</span>
              </label>
            ))}
          </div>

          {allTeams.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No team data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
