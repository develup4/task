"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { calculateCriticalPath } from "@/utils/criticalPath";
import { calculateDailyHeadcount } from "@/utils/headcountCalculator";
import FileUploader from "@/components/FileUploader";
import L5FlowGraph from "@/components/L5FlowGraph";
import L6FlowGraph from "@/components/L6FlowGraph";
import MMSummaryTable from "@/components/MMSummaryTable";
import ErrorListTable from "@/components/ErrorListTable";
import TeamFilter from "@/components/TeamFilter";
import LeftmostNodeMMTable from "@/components/LeftmostNodeMMTable";
import HeadcountTable from "@/components/HeadcountTable";
import Image from "next/image";
import Link from "next/link";

type Tab = "graph" | "l5-table" | "error-list";

export default function Home() {
  const {
    processedData,
    viewMode,
    setViewMode,
    setSelectedL5,
    selectedL5,
    getL5Task,
    filteredMM,
    getL6TasksForL5,
    showTooltips,
    toggleTooltips,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("graph");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [criticalPathDuration, setCriticalPathDuration] = useState(0);
  const [showHeadcountTable, setShowHeadcountTable] = useState(false);
  const [maxHeadcount, setMaxHeadcount] = useState(0);
  const [criticalPathBeforeHeadcount, setCriticalPathBeforeHeadcount] = useState(false);

  // L6 모드일 때 크리티컬 패스 및 최대 필요인력 계산
  useEffect(() => {
    if (viewMode === "l6-detail" && selectedL5) {
      const l6Tasks = getL6TasksForL5(selectedL5);
      const criticalPath = calculateCriticalPath(l6Tasks);
      setCriticalPathDuration(criticalPath.totalDuration);

      const headcountResult = calculateDailyHeadcount(l6Tasks);
      setMaxHeadcount(headcountResult.maxHeadcount);
    }
  }, [viewMode, selectedL5, getL6TasksForL5]);

  // 탭 정보 (아이콘 포함)
  const tabInfo: Record<Tab, { name: string; icon: string }> = {
    graph: { name: "Work Flow", icon: "⚡" },
    "l5-table": { name: "MM Summary", icon: "📊" },
    "error-list": { name: "Error Report", icon: "⚠️" },
  };

  // Breadcrumb 생성 함수
  const getBreadcrumb = () => {
    const parts = [tabInfo[activeTab].name];

    // L5-filtered나 L6 모드일 때 L4 정보 추가
    if (
      (viewMode === "l5-filtered" || viewMode === "l6-detail") &&
      selectedL5
    ) {
      const selectedTask = getL5Task(selectedL5);
      if (selectedTask) {
        // L5 정보 추가
        parts.push(selectedTask.name);

        // L6 모드일 때 L6 표시 추가 (실제 L6 이름은 나중에 선택 시 추가 가능)
        if (viewMode === "l6-detail") {
          parts.push("L6 GRAPH");
        }
      }
    }

    return parts.join(" - ");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[95%] mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Tailwind Logo */}
              <Image
                src="/images/favicon.svg"
                alt="Logo"
                width={30}
                height={30}
              />
              {/* Breadcrumb */}
              {processedData && (
                <div className="bg-[#E8EAEE] text-gray-600 px-4 py-2 rounded-xl text-sm font-medium">
                  {getBreadcrumb()}
                </div>
              )}
              {!processedData && (
                <h1 className="text-xl font-bold text-gray-800">
                  Workflow Viewer
                </h1>
              )}
            </div>
            <FileUploader />
          </div>
          {processedData && (
            <h1 className="text-2xl font-bold text-gray-800 mt-4">
              Workflow Viewer
            </h1>
          )}
        </div>
        {/* Tabs - 탭이 border 위에 위치 */}
        {processedData && (
          <div className="max-w-[95%] mx-auto">
            <div className="bg-white">
              <div className="flex justify-between items-center">
                <div role="tablist" className="tabs tabs-border">
                  {(Object.keys(tabInfo) as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      onClick={() => setActiveTab(tab)}
                      className={`tab text-xs gap-2 mr-5 cursor-pointer hover:font-bold hover:text-gray-700 ${
                        activeTab === tab
                          ? "tab-active font-bold text-gray-700"
                          : "text-gray-800"
                      }`}
                    >
                      <span>{tabInfo[tab].icon}</span>
                      <span>{tabInfo[tab].name}</span>
                      {tab === "error-list" &&
                        processedData?.errors &&
                        processedData.errors.length > 0 && (
                          <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {processedData.errors.length}
                          </span>
                        )}
                    </button>
                  ))}
                  <button
                    key="Help"
                    role="tab"
                    className="tab text-xs gap-2 mr-5 cursor-pointer hover:font-bold hover:text-gray-700 text-gray-800"
                  >
                    <Link href="" role="tab" target="_blank">
                      <p>📃 Guide</p>
                    </Link>
                  </button>
                </div>

                {/* Search box and filters - only show in graph tab and l5-all mode */}
                {activeTab === "graph" && viewMode === "l5-all" && (
                  <div className="flex gap-2 items-center mb-1">
                    <button
                      onClick={toggleTooltips}
                      className={`p-1.5 rounded-md font-medium cursor-pointer text-sm transition-colors ${
                        showTooltips ? "text-white" : "text-gray-600"
                      }`}
                      title={showTooltips ? "툴팁 숨기기" : "툴팁 보이기"}
                    >
                      <p className="hover:scale-110 transition-all duration-75">
                        {showTooltips ? "📜" : "🚫"}
                      </p>
                    </button>
                    <TeamFilter />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentSearchIndex(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setSearchTrigger((prev) => prev + 1);
                        }
                      }}
                      className="input input-ghost input-sm px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring focus:ring-sky-400 focus:bg-white text-sm"
                    />
                    {searchResultCount > 0 && (
                      <span className="text-sm text-gray-600 font-medium">
                        {currentSearchIndex}/{searchResultCount}
                      </span>
                    )}
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
            <h2 className="text-xl font-semibold text-gray-700 mb-1">
              Upload Excel File
            </h2>
            <p className="text-gray-500">
              EDM에서 프로세서 체계도 파일을 업로드하세요
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden max-w-[95%] mx-auto w-full">
          {/* Current L5 display for L6 view */}
          {viewMode === "l6-detail" && activeTab === "graph" && selectedL5 && (
            <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
              <div className="text-gray-700 font-medium flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">현재 L5:</span>
                    <span>{getL5Task(selectedL5)?.name || selectedL5}</span>
                  </div>
                  {showCriticalPath && (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">최대 필요 시간 T:</span>
                      <span className="font-bold">
                        {criticalPathDuration.toFixed(2)} weeks
                      </span>
                    </div>
                  )}
                  {showHeadcountTable && (
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">최대 필요인력 P:</span>
                      <span className="font-bold">
                        {maxHeadcount.toFixed(1)} 명
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCriticalPath(!showCriticalPath)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      showCriticalPath
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-white text-amber-600 border-2 border-amber-500 hover:bg-amber-50"
                    }`}
                  >
                    {showCriticalPath
                      ? "최대 필요 시간 경로 숨기기"
                      : "최대 필요 시간 경로 보기"}
                  </button>
                  <button
                    onClick={() => {
                      if (!showHeadcountTable) {
                        // Drawer를 열 때: 크리티컬 패스 상태 저장 후 숨기기
                        setCriticalPathBeforeHeadcount(showCriticalPath);
                        setShowCriticalPath(false);
                      } else {
                        // Drawer를 닫을 때: 이전 크리티컬 패스 상태 복구
                        setShowCriticalPath(criticalPathBeforeHeadcount);
                      }
                      setShowHeadcountTable(!showHeadcountTable);
                    }}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      showHeadcountTable
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-white text-purple-600 border-2 border-purple-500 hover:bg-purple-50"
                    }`}
                  >
                    {showHeadcountTable
                      ? "필요인력 테이블 숨기기"
                      : "필요인력 테이블 보기"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MM sum display for L5 filtered mode */}
          {viewMode === "l5-filtered" &&
            activeTab === "graph" &&
            selectedL5 && (
              <div className="bg-purple-50 px-6 py-3 border-b border-purple-200">
                <div className="text-gray-700 font-medium flex items-center gap-2">
                  <span className="text-purple-600">
                    선택된 노드 및 모든 선행 노드 총 MM:
                  </span>
                  <span className="font-bold">{filteredMM.toFixed(2)}</span>
                </div>
              </div>
            )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden bg-gray-50 flex relative">
            {activeTab === "graph" && (
              <div className="w-full h-full flex relative">
                {viewMode === "l6-detail" ? (
                  <>
                    <div className="flex-1 relative overflow-hidden">
                      <L6FlowGraph
                        onNavigateToErrorReport={() =>
                          setActiveTab("error-list")
                        }
                        showCriticalPath={showCriticalPath}
                        showHeadcountTable={showHeadcountTable}
                      />
                    </div>
                    {/* Headcount Drawer */}
                    <div
                      className={`absolute right-0 top-0 bottom-0 w-[550px] bg-white shadow-2xl z-40 border-l border-gray-200 transition-all duration-300 ease-in-out overflow-y-auto ${
                        showHeadcountTable
                          ? "translate-x-0 opacity-100"
                          : "translate-x-full opacity-0 pointer-events-none"
                      }`}
                    >
                      <div className="p-6">
                        <button
                          onClick={() => setShowHeadcountTable(false)}
                          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Close headcount drawer"
                        >
                          ✕
                        </button>
                        <HeadcountTable />
                      </div>
                    </div>
                    {/* Overlay when drawer is open */}
                    {showHeadcountTable && (
                      <div
                        className="absolute inset-0 bg-black/10 z-30 right-[550px]"
                        onClick={() => setShowHeadcountTable(false)}
                      />
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
                    onNavigateToErrorReport={() => setActiveTab("error-list")}
                  />
                )}
              </div>
            )}
            {activeTab === "l5-table" && (
              <div className="w-full h-full p-6 overflow-auto">
                <div className="flex flex-col gap-6 h-full">
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800">
                        최종 노드 누적 MM 요약
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        그래프에서 가장 왼쪽에 위치한 최종 노드들의 누적
                        MM입니다. 클릭하면 해당 노드를 중심으로 필터링됩니다.
                      </p>
                    </div>
                    <LeftmostNodeMMTable
                      onNavigateToGraph={() => setActiveTab("graph")}
                    />
                  </div>
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800">
                        L5 Task MM 요약
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        L5 노드들의 MM 테이블입니다. 클릭하면 해당 노드를
                        중심으로 필터링됩니다.
                      </p>
                    </div>
                    <MMSummaryTable
                      type="l5"
                      onNavigateToGraph={() => setActiveTab("graph")}
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === "error-list" && (
              <div className="w-full h-full p-6">
                <div className="bg-white rounded-lg shadow h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Error Report
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      프로세스 연결 중 발생한 오류들이 표시됩니다. 클릭하면 해당
                      노드를 중심으로 그래프가 필터링됩니다.
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ErrorListTable
                      onNavigateToGraph={() => setActiveTab("graph")}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
