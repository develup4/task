'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import FileUploader from '@/components/FileUploader';
import L5FlowGraph from '@/components/L5FlowGraph';
import L6FlowGraph from '@/components/L6FlowGraph';
import MMSummaryTable from '@/components/MMSummaryTable';
import ErrorListTable from '@/components/ErrorListTable';
import TeamFilter from '@/components/TeamFilter';
import LeftmostNodeMMTable from '@/components/LeftmostNodeMMTable';
import HelpGuide from '@/components/HelpGuide';
import HeadcountTable from '@/components/HeadcountTable';
import { calculateCriticalPath } from '@/utils/criticalPath';
import { calculateDailyHeadcount } from '@/utils/headcountCalculator';

type Tab = 'graph' | 'l5-table' | 'error-list' | 'help';

export default function Home() {
  const { processedData, viewMode, setViewMode, setSelectedL5, selectedL5, getL5Task, filteredMM, getL6TasksForL5, showTooltips, toggleTooltips } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [criticalPathDuration, setCriticalPathDuration] = useState(0);
  const [showHeadcountTable, setShowHeadcountTable] = useState(false);
  const [maxHeadcount, setMaxHeadcount] = useState(0);

  // L6 모드일 때 크리티컬 패스 및 최대 필요인력 계산
  useEffect(() => {
    if (viewMode === 'l6-detail' && selectedL5) {
      const l6Tasks = getL6TasksForL5(selectedL5);
      const criticalPath = calculateCriticalPath(l6Tasks);
      setCriticalPathDuration(criticalPath.totalDuration);

      const headcountResult = calculateDailyHeadcount(l6Tasks);
      setMaxHeadcount(headcountResult.maxHeadcount);
    }
  }, [viewMode, selectedL5, getL6TasksForL5]);

  // 탭 정보 (아이콘 포함)
  const tabInfo: Record<Tab, { name: string; icon: string }> = {
    'graph': { name: 'Work Flow', icon: '⚡' },
    'l5-table': { name: 'MM Summary', icon: '📊' },
    'error-list': { name: 'Error Report', icon: '⚠️' },
    'help': { name: 'Help', icon: '📖' }
  };

  // Breadcrumb 생성 함수
  const getBreadcrumb = () => {
    const parts = [tabInfo[activeTab].name];

    // L5-filtered나 L6 모드일 때 L4 정보 추가
    if ((viewMode === 'l5-filtered' || viewMode === 'l6-detail') && selectedL5) {
      const selectedTask = getL5Task(selectedL5);
      if (selectedTask) {
        // L4(부모) 정보 추가
        if (selectedTask.l4Category) {
          parts.push(selectedTask.l4Category);
        }
        // L5 정보 추가
        parts.push(selectedTask.name);

        // L6 모드일 때 L6 표시 추가 (실제 L6 이름은 나중에 선택 시 추가 가능)
        if (viewMode === 'l6-detail') {
          parts.push('L6 Details');
        }
      }
    }

    return parts.join(' > ');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[95%] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Tailwind Logo */}
              <img src="/tailwind-logo.svg" alt="Tailwind CSS" className="h-8" />
              {/* Breadcrumb */}
              <div className="bg-[#1A222D] text-white px-4 py-2 rounded-lg text-sm font-medium">
                {getBreadcrumb()}
              </div>
            </div>
            <FileUploader />
          </div>
        </div>
        {/* Tabs - 탭이 border 위에 위치 */}
        {processedData && (
          <div className="max-w-[95%] mx-auto">
            <div className="bg-white px-6">
              <div className="flex justify-between items-center">
                <div role="tablist" className="tabs tabs-bordered">
                  {(Object.keys(tabInfo) as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      onClick={() => setActiveTab(tab)}
                      className={`tab gap-2 ${activeTab === tab ? 'tab-active' : ''}`}
                    >
                      <span>{tabInfo[tab].icon}</span>
                      <span>{tabInfo[tab].name}</span>
                      {tab === 'error-list' && processedData?.errors && processedData.errors.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {processedData.errors.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search box and filters - only show in graph tab and l5-all mode */}
                {activeTab === 'graph' && viewMode === 'l5-all' && (
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={toggleTooltips}
                      className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
                        showTooltips
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={showTooltips ? '툴팁 숨기기' : '툴팁 보이기'}
                    >
                      {showTooltips ? '💬' : '🚫'}
                    </button>
                    <TeamFilter />
                    <input
                      type="text"
                      placeholder="Search..."
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
                      className="input input-ghost input-sm px-3 py-1.5 border-none bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white text-sm"
                    />
                    {searchResultCount > 0 && (
                      <span className="text-sm text-gray-600 font-medium">
                        {currentSearchIndex}/{searchResultCount}
                      </span>
                    )}
                    <button
                      onClick={() => setSearchTrigger(prev => prev + 1)}
                      disabled={!searchQuery.trim()}
                      className="px-3 py-1.5 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      {!processedData ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="max-w-[95%] mx-auto text-center">
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
        <div className="flex-1 flex flex-col overflow-hidden max-w-[95%] mx-auto w-full">
          {/* Current L5 display for L6 view */}
          {viewMode === 'l6-detail' && activeTab === 'graph' && selectedL5 && (
            <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
              <div className="text-gray-700 font-medium flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">현재 L5:</span>
                    <span>{getL5Task(selectedL5)?.name || selectedL5}</span>
                  </div>
                  {showCriticalPath && (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">크리티컬 패스 T:</span>
                      <span className="font-bold">{criticalPathDuration.toFixed(2)} weeks</span>
                    </div>
                  )}
                  {showHeadcountTable && (
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">최대 필요인력 P:</span>
                      <span className="font-bold">{maxHeadcount.toFixed(1)} 명</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCriticalPath(!showCriticalPath)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      showCriticalPath
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-white text-amber-600 border-2 border-amber-500 hover:bg-amber-50'
                    }`}
                  >
                    {showCriticalPath ? '크리티컬 패스 숨기기' : '크리티컬 패스 보기'}
                  </button>
                  <button
                    onClick={() => setShowHeadcountTable(!showHeadcountTable)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      showHeadcountTable
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : 'bg-white text-purple-600 border-2 border-purple-500 hover:bg-purple-50'
                    }`}
                  >
                    {showHeadcountTable ? '필요인력 테이블 숨기기' : '필요인력 테이블 보기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MM sum display for L5 filtered mode */}
          {viewMode === 'l5-filtered' && activeTab === 'graph' && selectedL5 && (
            <div className="bg-purple-50 px-6 py-3 border-b border-purple-200">
              <div className="text-gray-700 font-medium flex items-center gap-2">
                <span className="text-purple-600">선택된 노드 및 모든 선행 노드 총 MM:</span>
                <span className="font-bold">{filteredMM.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            {activeTab === 'graph' && (
              <div className="w-full h-full flex flex-col">
                {viewMode === 'l6-detail' ? (
                  <>
                    <div className={showHeadcountTable ? 'h-1/2' : 'flex-1'}>
                      <L6FlowGraph
                        onNavigateToErrorReport={() => setActiveTab('error-list')}
                        showCriticalPath={showCriticalPath}
                      />
                    </div>
                    {showHeadcountTable && (
                      <div className="h-1/2 p-6 overflow-auto">
                        <HeadcountTable />
                      </div>
                    )}
                  </>
                ) : (
                  <L5FlowGraph
                    searchQuery={searchQuery}
                    searchTrigger={searchTrigger}
                    onSearchResultsChange={(count, index) => {
                      setSearchResultCount(count);
                      setCurrentSearchIndex(index);
                    }}
                    onNavigateToErrorReport={() => setActiveTab('error-list')}
                  />
                )}
              </div>
            )}
            {activeTab === 'l5-table' && (
              <div className="w-full h-full p-6 overflow-auto">
                <div className="flex flex-col gap-6 h-full">
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800">
                        가장 왼쪽 노드 누적 MM 요약 (내림차순)
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        L5-all 그래프에서 가장 왼쪽에 위치한 최하단 노드(더 이상 후행이 없는 노드)들의 누적 MM입니다. 클릭하면 해당 노드를 중심으로 필터링됩니다.
                      </p>
                    </div>
                    <LeftmostNodeMMTable onNavigateToGraph={() => setActiveTab('graph')} />
                  </div>
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800">
                        L5 Task MM 요약 (내림차순)
                      </h2>
                    </div>
                    <MMSummaryTable type="l5" onNavigateToGraph={() => setActiveTab('graph')} />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'error-list' && (
              <div className="w-full h-full p-6">
                <div className="bg-white rounded-lg shadow h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      프로세스 검증 오류 목록
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      선행/후행 프로세스 중 정의되지 않은 프로세스들이 표시됩니다. 클릭하면 해당 노드를 중심으로 그래프가 필터링됩니다.
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ErrorListTable onNavigateToGraph={() => setActiveTab('graph')} />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'help' && (
              <div className="w-full h-full">
                <HelpGuide />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
