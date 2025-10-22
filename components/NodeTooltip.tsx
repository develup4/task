'use client';

import { L5Task, L6Task } from '@/types/task';

interface NodeTooltipProps {
  data: Partial<L5Task> | Partial<L6Task>;
  isL5?: boolean;
  isL6?: boolean;
}

export default function NodeTooltip({ data, isL5, isL6 }: NodeTooltipProps) {
  return (
    <div className="absolute left-full ml-4 top-0 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
      <div className="bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700 p-5 min-w-[420px] max-w-[600px]" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)' }}>
        {/* Header */}
        <div className="mb-4 pb-4 border-b-2 border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-lg shadow-lg">
              {isL5 ? 'L5 프로세스' : isL6 ? 'L6 액티비티' : 'Task'}
            </span>
            <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded">{data.id}</span>
          </div>
          <h3 className="font-bold text-xl text-white mt-2">{data.name}</h3>
          {data.l4Category && (
            <div className="mt-2 text-sm text-slate-300">
              <span className="font-semibold text-slate-200">카테고리:</span> <span className="text-blue-300">{data.l4Category}</span>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="mb-4 pb-4 border-b border-slate-700">
          <h4 className="font-semibold text-sm text-slate-200 mb-3">📊 리소스 정보</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/20 border border-blue-500/30 p-2.5 rounded-lg">
              <div className="text-xs text-blue-300 mb-1">필요인력</div>
              <div className="font-bold text-white text-base">{data.필요인력}명</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/30 to-green-700/20 border border-green-500/30 p-2.5 rounded-lg">
              <div className="text-xs text-green-300 mb-1">필요기간</div>
              <div className="font-bold text-white text-base">{data.필요기간}주</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/20 border border-purple-500/30 p-2.5 rounded-lg">
              <div className="text-xs text-purple-300 mb-1">MM</div>
              <div className="font-bold text-white text-base">{data.MM?.toFixed(1)}</div>
            </div>
          </div>
          {'cumulativeMM' in data && data.cumulativeMM !== undefined && (
            <div className="mt-2 bg-gradient-to-br from-orange-600/30 to-orange-700/20 border border-orange-500/30 p-2.5 rounded-lg">
              <div className="text-xs text-orange-300 mb-1">누적 MM</div>
              <div className="font-bold text-white text-base">{data.cumulativeMM.toFixed(1)}</div>
            </div>
          )}
        </div>

        {/* Definition */}
        {data.정의 && (
          <div className="mb-4 pb-4 border-b border-slate-700">
            <h4 className="font-semibold text-sm text-slate-200 mb-2">📝 정의</h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg">{data.정의}</p>
          </div>
        )}

        {/* L5 Specific Information */}
        {isL5 && (
          <div className="mb-3 space-y-2">
            {'프로세스 오너부서(L5)' in data && data['프로세스 오너부서(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">프로세스 오너부서:</span>
                <span className="text-sm text-slate-200">{data['프로세스 오너부서(L5)']}</span>
              </div>
            )}
            {'산출물(L5)' in data && data['산출물(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">산출물:</span>
                <span className="text-sm text-slate-200">{data['산출물(L5)']}</span>
              </div>
            )}
            {'준수지표(L5)' in data && data['준수지표(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">준수지표:</span>
                <span className="text-sm text-slate-200">{data['준수지표(L5)']}</span>
              </div>
            )}
            {'소요기간(L5)' in data && data['소요기간(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">소요기간:</span>
                <span className="text-sm text-slate-200">{data['소요기간(L5)']}</span>
              </div>
            )}
            {'수행주기(L5)' in data && data['수행주기(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">수행주기:</span>
                <span className="text-sm text-slate-200">{data['수행주기(L5)']}</span>
              </div>
            )}
            {'참여(L5)' in data && data['참여(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">참여:</span>
                <span className="text-sm text-slate-200">{data['참여(L5)']}</span>
              </div>
            )}
            {'바로가기 URL(L5)' in data && data['바로가기 URL(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">바로가기 URL:</span>
                <a href={data['바로가기 URL(L5)']} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all">
                  {data['바로가기 URL(L5)']}
                </a>
              </div>
            )}
          </div>
        )}

        {/* L6 Specific Information */}
        {isL6 && (
          <div className="mb-3 space-y-2">
            {'업무담당부서(L6)' in data && data['업무담당부서(L6)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">업무담당부서:</span>
                <span className="text-sm text-slate-200">{data['업무담당부서(L6)']}</span>
              </div>
            )}
            {'참여부서(L6)' in data && data['참여부서(L6)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">참여부서:</span>
                <span className="text-sm text-slate-200">{data['참여부서(L6)']}</span>
              </div>
            )}
            {'시스템' in data && data.시스템 && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">시스템:</span>
                <span className="text-sm text-slate-200">{data.시스템}</span>
              </div>
            )}
            {'작업방식(L6)' in data && data['작업방식(L6)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">작업방식:</span>
                <span className="text-sm text-slate-200">{data['작업방식(L6)']}</span>
              </div>
            )}
            {'l5Parent' in data && data.l5Parent && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-slate-400 min-w-[100px]">상위 L5:</span>
                <span className="text-sm text-slate-200">{data.l5Parent}</span>
              </div>
            )}
          </div>
        )}

        {/* Predecessors and Successors */}
        {((data.predecessors && data.predecessors.length > 0) || (data.successors && data.successors.length > 0)) && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="font-semibold text-sm text-slate-200 mb-3">🔗 연결 관계</h4>
            {data.predecessors && data.predecessors.length > 0 && (
              <div className="mb-3">
                <span className="font-semibold text-xs text-slate-400">선행:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.predecessors.map((pred, idx) => (
                    <span key={idx} className="inline-block px-2.5 py-1 bg-slate-700/50 text-xs text-slate-200 rounded-md border border-slate-600 hover:bg-slate-600/50 transition-colors">
                      {pred}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.successors && data.successors.length > 0 && (
              <div>
                <span className="font-semibold text-xs text-slate-400">후행:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.successors.map((succ, idx) => (
                    <span key={idx} className="inline-block px-2.5 py-1 bg-slate-700/50 text-xs text-slate-200 rounded-md border border-slate-600 hover:bg-slate-600/50 transition-colors">
                      {succ}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* L6 - L5 Relations */}
        {isL6 && (
          <>
            {('선행 L5' in data && data['선행 L5'] && data['선행 L5'].length > 0) && (
              <div className="mt-3">
                <span className="font-semibold text-xs text-slate-400">선행 L5:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data['선행 L5'].map((l5, idx) => (
                    <span key={idx} className="inline-block px-2.5 py-1 bg-blue-600/20 text-xs text-blue-300 rounded-md border border-blue-500/30">
                      {l5}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {('후행 L5' in data && data['후행 L5'] && data['후행 L5'].length > 0) && (
              <div className="mt-3">
                <span className="font-semibold text-xs text-slate-400">후행 L5:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data['후행 L5'].map((l5, idx) => (
                    <span key={idx} className="inline-block px-2.5 py-1 bg-blue-600/20 text-xs text-blue-300 rounded-md border border-blue-500/30">
                      {l5}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Warning for cycles */}
        {data.hasCycle && (
          <div className="mt-4 pt-4 border-t border-red-800/50 bg-gradient-to-r from-red-900/30 to-red-800/20 p-3 rounded-lg border border-red-600/30">
            <div className="flex items-center text-red-300">
              <span className="text-lg mr-2">⚠️</span>
              <span className="font-semibold text-sm">양방향 연결 감지됨</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
