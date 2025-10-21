'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function TeamFilter() {
  const {
    getTeams,
    visibleTeams,
    toggleTeam,
    showAllTeams,
    hideAllTeams,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allTeams = getTeams();
  const selectedCount = visibleTeams.size;
  const totalCount = allTeams.length;

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium flex items-center gap-2"
      >
        <span>작성팀 ({selectedCount}/{totalCount})</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={showAllTeams}
                className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                전체 선택
              </button>
              <button
                onClick={hideAllTeams}
                className="flex-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                전체 해제
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {allTeams.map((team) => (
              <label
                key={team}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleTeams.has(team)}
                  onChange={() => toggleTeam(team)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">{team}</span>
              </label>
            ))}
          </div>

          {allTeams.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              작성팀 정보가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
