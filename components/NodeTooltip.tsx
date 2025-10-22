'use client';

import { L5Task, L6Task } from '@/types/task';

interface NodeTooltipProps {
  data: Partial<L5Task> | Partial<L6Task>;
  isL5?: boolean;
  isL6?: boolean;
}

export default function NodeTooltip({ data, isL5, isL6 }: NodeTooltipProps) {
  return (
    <div className="absolute left-full ml-4 top-0 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 min-w-[400px] max-w-[600px]">
        {/* Header */}
        <div className="mb-3 pb-3 border-b-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
              {isL5 ? 'L5 프로세스' : isL6 ? 'L6 액티비티' : 'Task'}
            </span>
            <span className="text-xs text-gray-500 font-mono">{data.id}</span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">{data.name}</h3>
          {data.l4Category && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">카테고리:</span> {data.l4Category}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="mb-3 pb-3 border-b border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">📊 리소스 정보</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-xs text-gray-600 mb-1">필요인력</div>
              <div className="font-bold text-blue-700">{data.필요인력}명</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="text-xs text-gray-600 mb-1">필요기간</div>
              <div className="font-bold text-green-700">{data.필요기간}주</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-xs text-gray-600 mb-1">MM</div>
              <div className="font-bold text-purple-700">{data.MM?.toFixed(1)}</div>
            </div>
          </div>
          {'cumulativeMM' in data && data.cumulativeMM !== undefined && (
            <div className="mt-2 bg-orange-50 p-2 rounded">
              <div className="text-xs text-gray-600 mb-1">누적 MM</div>
              <div className="font-bold text-orange-700">{data.cumulativeMM.toFixed(1)}</div>
            </div>
          )}
        </div>

        {/* Definition */}
        {data.정의 && (
          <div className="mb-3 pb-3 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">📝 정의</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{data.정의}</p>
          </div>
        )}

        {/* L5 Specific Information */}
        {isL5 && (
          <>
            {'프로세스 오너부서(L5)' in data && data['프로세스 오너부서(L5)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">프로세스 오너부서:</span>
                <span className="ml-2 text-sm text-gray-600">{data['프로세스 오너부서(L5)']}</span>
              </div>
            )}
            {'산출물(L5)' in data && data['산출물(L5)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">산출물:</span>
                <span className="ml-2 text-sm text-gray-600">{data['산출물(L5)']}</span>
              </div>
            )}
            {'준수지표(L5)' in data && data['준수지표(L5)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">준수지표:</span>
                <span className="ml-2 text-sm text-gray-600">{data['준수지표(L5)']}</span>
              </div>
            )}
            {'소요기간(L5)' in data && data['소요기간(L5)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">소요기간:</span>
                <span className="ml-2 text-sm text-gray-600">{data['소요기간(L5)']}</span>
              </div>
            )}
            {'수행주기(L5)' in data && data['수행주기(L5)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">수행주기:</span>
                <span className="ml-2 text-sm text-gray-600">{data['수행주기(L5)']}</span>
              </div>
            )}
            {'참여(L5)' in data && data['참여(L5)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">참여:</span>
                <span className="ml-2 text-sm text-gray-600">{data['참여(L5)']}</span>
              </div>
            )}
            {'바로가기 URL(L5)' in data && data['바로가기 URL(L5)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">바로가기 URL:</span>
                <a href={data['바로가기 URL(L5)']} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm text-blue-600 hover:underline break-all">
                  {data['바로가기 URL(L5)']}
                </a>
              </div>
            )}
          </>
        )}

        {/* L6 Specific Information */}
        {isL6 && (
          <>
            {'업무담당부서(L6)' in data && data['업무담당부서(L6)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">업무담당부서:</span>
                <span className="ml-2 text-sm text-gray-600">{data['업무담당부서(L6)']}</span>
              </div>
            )}
            {'참여부서(L6)' in data && data['참여부서(L6)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">참여부서:</span>
                <span className="ml-2 text-sm text-gray-600">{data['참여부서(L6)']}</span>
              </div>
            )}
            {'시스템' in data && data.시스템 && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">시스템:</span>
                <span className="ml-2 text-sm text-gray-600">{data.시스템}</span>
              </div>
            )}
            {'작업방식(L6)' in data && data['작업방식(L6)'] && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">작업방식:</span>
                <span className="ml-2 text-sm text-gray-600">{data['작업방식(L6)']}</span>
              </div>
            )}
            {'l5Parent' in data && data.l5Parent && (
              <div className="mb-2">
                <span className="font-semibold text-sm text-gray-700">상위 L5:</span>
                <span className="ml-2 text-sm text-gray-600">{data.l5Parent}</span>
              </div>
            )}
          </>
        )}

        {/* Predecessors and Successors */}
        {((data.predecessors && data.predecessors.length > 0) || (data.successors && data.successors.length > 0)) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">🔗 연결 관계</h4>
            {data.predecessors && data.predecessors.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-xs text-gray-600">선행:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {data.predecessors.map((pred, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded border border-gray-300">
                      {pred}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.successors && data.successors.length > 0 && (
              <div>
                <span className="font-semibold text-xs text-gray-600">후행:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {data.successors.map((succ, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded border border-gray-300">
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
              <div className="mt-2">
                <span className="font-semibold text-xs text-gray-600">선행 L5:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {data['선행 L5'].map((l5, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-blue-100 text-xs text-blue-700 rounded border border-blue-300">
                      {l5}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {('후행 L5' in data && data['후행 L5'] && data['후행 L5'].length > 0) && (
              <div className="mt-2">
                <span className="font-semibold text-xs text-gray-600">후행 L5:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {data['후행 L5'].map((l5, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-blue-100 text-xs text-blue-700 rounded border border-blue-300">
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
          <div className="mt-3 pt-3 border-t border-red-200 bg-red-50 p-2 rounded">
            <div className="flex items-center text-red-700">
              <span className="text-lg mr-2">⚠️</span>
              <span className="font-semibold text-sm">양방향 연결 감지됨</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
