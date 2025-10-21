'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import FileUploader from '@/components/FileUploader';
import L5FlowGraph from '@/components/L5FlowGraph';
import L6FlowGraph from '@/components/L6FlowGraph';
import MMSummaryTable from '@/components/MMSummaryTable';
import ErrorListTable from '@/components/ErrorListTable';
import StartNodeMMTable from '@/components/StartNodeMMTable';

type Tab = 'graph' | 'l5-table' | 'start-node-table' | 'final-table' | 'error-list';

export default function Home() {
  const { processedData, viewMode, setViewMode, setSelectedL5 } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const handleBackToL5 = () => {
    setViewMode('l5-all');
    setSelectedL5(null);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">DTF Process Viewer</h1>
          <FileUploader />
        </div>
      </header>

      {/* Content */}
      {!processedData ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              엑셀 파일을 업로드하세요
            </h2>
            <p className="text-gray-500">
              프로세스 workflow를 시각화하고 분석할 수 있습니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 px-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'graph'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Workflow 그래프
                </button>
                <button
                  onClick={() => setActiveTab('l5-table')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'l5-table'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  L5 MM 요약
                </button>
                <button
                  onClick={() => setActiveTab('start-node-table')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'start-node-table'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  시작 노드 MM 요약
                </button>
                <button
                  onClick={() => setActiveTab('final-table')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'final-table'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  최종 노드 MM 요약
                </button>
                <button
                  onClick={() => setActiveTab('error-list')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'error-list'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  오류 목록
                  {processedData?.errors && processedData.errors.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {processedData.errors.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search box - only show in graph tab */}
              {activeTab === 'graph' && (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="L5 노드 검색..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentSearchIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSearchTrigger(prev => prev + 1);
                      }
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {searchResultCount > 0 && (
                    <span className="text-sm text-gray-600 font-medium">
                      {currentSearchIndex}/{searchResultCount}
                    </span>
                  )}
                  <button
                    onClick={() => setSearchTrigger(prev => prev + 1)}
                    disabled={!searchQuery.trim()}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation breadcrumb for L6 view */}
          {viewMode === 'l6-detail' && activeTab === 'graph' && (
            <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
              <button
                onClick={handleBackToL5}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
              >
                ← L5 그래프로 돌아가기
              </button>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            {activeTab === 'graph' && (
              <div className="w-full h-full">
                {viewMode === 'l6-detail' ? (
                  <L6FlowGraph />
                ) : (
                  <L5FlowGraph
                    searchQuery={searchQuery}
                    searchTrigger={searchTrigger}
                    onSearchResultsChange={(count, index) => {
                      setSearchResultCount(count);
                      setCurrentSearchIndex(index);
                    }}
                  />
                )}
              </div>
            )}
            {activeTab === 'l5-table' && (
              <div className="w-full h-full p-6">
                <div className="bg-white rounded-lg shadow h-full">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      L5 Task MM 요약 (내림차순)
                    </h2>
                  </div>
                  <MMSummaryTable type="l5" />
                </div>
              </div>
            )}
            {activeTab === 'start-node-table' && (
              <div className="w-full h-full p-6">
                <div className="bg-white rounded-lg shadow h-full">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      시작 노드 누적 MM 요약 (내림차순)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      각 L5 작업의 가장 왼쪽 노드(시작 노드)에서 계산된 누적 MM입니다.
                    </p>
                  </div>
                  <StartNodeMMTable />
                </div>
              </div>
            )}
            {activeTab === 'final-table' && (
              <div className="w-full h-full p-6">
                <div className="bg-white rounded-lg shadow h-full">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      최종 노드 누적 MM 요약 (내림차순)
                    </h2>
                  </div>
                  <MMSummaryTable type="final" />
                </div>
              </div>
            )}
            {activeTab === 'error-list' && (
              <div className="w-full h-full p-6">
                <div className="bg-white rounded-lg shadow h-full">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      프로세스 검증 오류 목록
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      선행/후행 프로세스 중 정의되지 않은 프로세스들이 표시됩니다.
                    </p>
                  </div>
                  <ErrorListTable />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
