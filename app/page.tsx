"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { calculateCriticalPath, calculateL5CriticalPath } from "@/utils/criticalPath";
import { calculateDailyHeadcount } from "@/utils/headcountCalculator";
import { getColorForCategory } from "@/utils/colors";
import { L5Task, L6Task } from "@/types/task";
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
    setL5FilteredCriticalPath,
    l5MaxHeadcountMap,
    setL5FilteredMaxHeadcount,
    setL5FilteredMaxDuration,
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
  const [criticalPathBeforeHeadcount, setCriticalPathBeforeHeadcount] =
    useState(false);
  const [hiddenTableL4Categories, setHiddenTableL4Categories] = useState<
    Set<string>
  >(new Set());
  const [filteredL5TasksForHeadcount, setFilteredL5TasksForHeadcount] = useState<any[]>([]);

  // 뷰 모드 변경 시 critical path와 headcount table 보기 비활성화
  useEffect(() => {
    setShowCriticalPath(false);
    setShowHeadcountTable(false);
  }, [viewMode]);

  // L5-all 모드일 때: 모든 L5 노드의 경로 최대값 미리 계산
  useEffect(() => {
    if (viewMode === "l5-all" && processedData && l5MaxHeadcountMap.size > 0) {
      // 모든 L5 노드에 대해 경로 최대값 계산
      Array.from(processedData.l5Tasks.values()).forEach((l5Node) => {
        // 이 노드까지의 모든 선행 노드 수집
        const predecessorIds = new Set<string>([l5Node.id]);
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

        collectPredecessors(l5Node.id);

        // 필터링된 L5 노드들
        const filteredL5Tasks = Array.from(processedData.l5Tasks.values()).filter(
          (t) => predecessorIds.has(t.id)
        );

        // 이 노드까지의 경로에서 최대 필요기간 계산
        const criticalPath = calculateL5CriticalPath(filteredL5Tasks);
        setL5FilteredMaxDuration(l5Node.id, criticalPath.totalDuration);

        // 이 노드까지의 경로에서 최대 필요인력 계산
        const l5FilteredHeadcountResult = calculateDailyHeadcount(
          filteredL5Tasks.map(task => ({
            ...task,
            필요인력: l5MaxHeadcountMap.get(task.id) || task.필요인력
          })) as any
        );
        setL5FilteredMaxHeadcount(l5Node.id, l5FilteredHeadcountResult.maxHeadcount);
      });
    }
  }, [viewMode, processedData, l5MaxHeadcountMap, setL5FilteredMaxHeadcount, setL5FilteredMaxDuration]);

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

  // L5-filtered 모드일 때: L5 노드들의 critical path 및 최대 필요인력 계산
  useEffect(() => {
    if (viewMode === "l5-filtered" && selectedL5 && processedData) {
      // 선택된 L5와 모든 선행 L5 노드들 수집
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

      // 필터링된 L5 노드들로 critical path 계산
      const filteredL5Tasks = Array.from(processedData.l5Tasks.values()).filter(
        (t) => predecessorIds.has(t.id)
      );

      // HeadcountTable에 전달할 L5 tasks 저장
      setFilteredL5TasksForHeadcount(filteredL5Tasks);

      // L5 노드들의 필요기간을 사용하여 critical path 계산
      const criticalPath = calculateL5CriticalPath(filteredL5Tasks);
      setCriticalPathDuration(criticalPath.totalDuration);
      // Store에도 저장
      setL5FilteredMaxDuration(selectedL5, criticalPath.totalDuration);

      // L5-filtered 모드의 최대 필요인력 계산
      // L5 노드들을 L6처럼 취급하되, displayHeadcount로 필요인력 대체
      const l5FilteredHeadcountResult = calculateDailyHeadcount(
        filteredL5Tasks.map(task => ({
          ...task,
          필요인력: l5MaxHeadcountMap.get(task.id) || task.필요인력
        })) as any
      );
      setMaxHeadcount(l5FilteredHeadcountResult.maxHeadcount);
      // Store에도 저장
      setL5FilteredMaxHeadcount(selectedL5, l5FilteredHeadcountResult.maxHeadcount);

      // Critical path 노드들을 store에 저장
      const criticalPathNodeSet = new Set(criticalPath.path);

      // Critical path 엣지들 생성 (연속된 노드들 사이의 엣지)
      const criticalPathEdges = new Set<string>();
      for (let i = 0; i < criticalPath.path.length - 1; i++) {
        criticalPathEdges.add(`${criticalPath.path[i]}-${criticalPath.path[i + 1]}`);
      }

      setL5FilteredCriticalPath(criticalPathNodeSet, criticalPathEdges);
    }
  }, [viewMode, selectedL5, processedData, setL5FilteredCriticalPath, l5MaxHeadcountMap]);

  // 탭 정보 (아이콘 포함)
  const tabInfo: Record<Tab, { name: string; icon: string }> = {
    graph: { name: "Work Flow", icon: "⚡" },
    "l5-table": { name: "MM Summary", icon: "📊" },
    "error-list": { name: "Error Report", icon: "⚠️" },
  };

  // 모든 L4 카테고리 가져오기
  const allL4Categories = useMemo(() => {
    if (!processedData) return [];
    const categories = new Set(
      Array.from(processedData.l5Tasks.values()).map((t) => t.l4Category)
    );
    return Array.from(categories).sort();
  }, [processedData]);

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

  const handleTableL4FilterToggle = (category: string) => {
    const newHidden = new Set(hiddenTableL4Categories);
    if (newHidden.has(category)) {
      newHidden.delete(category);
    } else {
      newHidden.add(category);
    }
    setHiddenTableL4Categories(newHidden);
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

                {/* Search box and filters - show in graph tab for l5-all and l5-filtered modes */}
                {activeTab === "graph" &&
                  (viewMode === "l5-all" || viewMode === "l5-filtered") && (
                    <div className="flex gap-2 items-center mb-1">
                      {viewMode === "l5-all" && (
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
                      )}
                      <TeamFilter />
                      {viewMode === "l5-all" && (
                        <>
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
                        </>
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
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">최대 필요 시간 T:</span>
                    <span className="font-bold">
                      {criticalPathDuration.toFixed(2)} weeks
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">최대 필요인력 P:</span>
                    <span className="font-bold">
                      {maxHeadcount.toFixed(1)} 명
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCriticalPath(!showCriticalPath);
                      // 최대 필요 시간 경로를 보일 때 headcount drawer 닫기
                      if (!showCriticalPath && showHeadcountTable) {
                        setShowHeadcountTable(false);
                      }
                    }}
                    className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
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
                    className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                      showHeadcountTable
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-white text-purple-600 border-2 border-purple-500 hover:bg-purple-50"
                    }`}
                  >
                    {showHeadcountTable
                      ? "최대 필요인력 테이블 숨기기"
                      : "최대 필요인력 테이블 보기"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MM sum and controls display for L5 filtered mode */}
          {viewMode === "l5-filtered" &&
            activeTab === "graph" &&
            selectedL5 && (
              <div className="bg-purple-50 px-6 py-3 border-b border-purple-200">
                <div className="text-gray-700 font-medium flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">
                        선택된 노드 및 모든 선행 노드 총 MM:
                      </span>
                      <span className="font-bold">{filteredMM.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">최대 필요 시간 T:</span>
                      <span className="font-bold">
                        {criticalPathDuration.toFixed(2)} weeks
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">최대 필요인력 P:</span>
                      <span className="font-bold">
                        {maxHeadcount.toFixed(1)} 명
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowCriticalPath(!showCriticalPath);
                        // 최대 필요 시간 경로를 보일 때 headcount drawer 닫기
                        if (!showCriticalPath && showHeadcountTable) {
                          setShowHeadcountTable(false);
                        }
                      }}
                      className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
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
                      className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                        showHeadcountTable
                          ? "bg-purple-500 text-white hover:bg-purple-600"
                          : "bg-white text-purple-600 border-2 border-purple-500 hover:bg-purple-50"
                      }`}
                    >
                      {showHeadcountTable
                        ? "최대 필요인력 테이블 숨기기"
                        : "최대 필요인력 테이블 보기"}
                    </button>
                  </div>
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
                  </>
                ) : (
                  <>
                    <div className="flex-1 relative overflow-hidden">
                      <L5FlowGraph
                        searchQuery={searchQuery}
                        searchTrigger={searchTrigger}
                        onSearchResultsChange={(count, index) => {
                          setSearchResultCount(count);
                          setCurrentSearchIndex(index);
                        }}
                        onNavigateToErrorReport={() => setActiveTab("error-list")}
                        showCriticalPath={showCriticalPath && viewMode === "l5-filtered"}
                        showHeadcountTable={showHeadcountTable && viewMode === "l5-filtered"}
                      />
                    </div>
                    {/* Headcount Drawer for L5-filtered */}
                    {viewMode === "l5-filtered" && (
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
                          <HeadcountTable tasks={filteredL5TasksForHeadcount as (L5Task | L6Task)[]} />
                        </div>
                      </div>
                    )}
                  </>
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
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800">
                            L5 Task MM 요약
                          </h2>
                          <p className="text-sm text-gray-500 mt-1">
                            L5 노드들의 MM 테이블입니다. 클릭하면 해당 노드를
                            중심으로 필터링됩니다.
                          </p>
                        </div>
                        <div className="mt-4">
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "6px",
                              justifyContent: "flex-end",
                            }}
                          >
                            {allL4Categories.map((category) => {
                              const colors = getColorForCategory(category);
                              const isHidden =
                                hiddenTableL4Categories.has(category);
                              return (
                                <button
                                  key={category}
                                  onClick={() =>
                                    handleTableL4FilterToggle(category)
                                  }
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "4px",
                                    border: `2px solid ${colors.border}`,
                                    backgroundColor: isHidden
                                      ? "white"
                                      : colors.bg,
                                    color: colors.text,
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    opacity: isHidden ? 0.4 : 1,
                                  }}
                                >
                                  {category}
                                </button>
                              );
                            })}
                            {hiddenTableL4Categories.size > 0 && (
                              <button
                                onClick={() =>
                                  setHiddenTableL4Categories(new Set())
                                }
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                  backgroundColor: "#f0f0f0",
                                  color: "#666",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                              >
                                초기화
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <MMSummaryTable
                      type="l5"
                      onNavigateToGraph={() => setActiveTab("graph")}
                      hiddenL4Categories={hiddenTableL4Categories}
                      onHiddenL4CategoriesChange={setHiddenTableL4Categories}
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
