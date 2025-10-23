'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { L5Task, L6Task } from '@/types/task';
import { formatDecimal } from '@/utils/format';

interface NodeTooltipProps {
  data: Partial<L5Task> | Partial<L6Task>;
  isL5?: boolean;
  isL6?: boolean;
}

// 파이프로 구분된 값을 파싱하여 태그로 표시
const renderPipeSeparatedValue = (value: string | undefined) => {
  if (!value) return null;

  // 파이프가 있으면 분리해서 태그로 표시
  if (value.includes('|')) {
    const items = value.split('|').map(s => s.trim()).filter(s => s);
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span key={idx} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
            {item}
          </span>
        ))}
      </div>
    );
  }

  // 파이프가 없으면 그냥 텍스트로 표시
  return <span className="text-sm text-gray-800">{value}</span>;
};

export default function NodeTooltip({ data, isL5, isL6 }: NodeTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const parentRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (parentRef.current && tooltipRef.current) {
        const rect = parentRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const margin = 16;
        const tooltipWidth = 420; // min-w-[420px]
        const tooltipHeight = tooltipRect.height || 600; // 예상 높이

        let x = rect.right + margin;
        let y = rect.top;

        // 오른쪽에 공간이 부족하면 왼쪽에 표시
        if (x + tooltipWidth > viewportWidth) {
          x = rect.left - tooltipWidth - margin;
        }

        // 왼쪽도 부족하면 화면 오른쪽 끝에 맞춤
        if (x < 0) {
          x = viewportWidth - tooltipWidth - margin;
        }

        // 아래쪽에 공간이 부족하면 위로 조정
        if (y + tooltipHeight > viewportHeight) {
          y = viewportHeight - tooltipHeight - margin;
        }

        // 위쪽도 부족하면 화면 위쪽에 맞춤
        if (y < 0) {
          y = margin;
        }

        setPosition({ x, y });
      }
    };

    const parentElement = parentRef.current?.closest('.group');
    if (parentElement) {
      parentElement.addEventListener('mouseenter', () => {
        setIsHovered(true);
        updatePosition();
      });
      parentElement.addEventListener('mouseleave', () => {
        setIsHovered(false);
      });

      // Update position on scroll or resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        parentElement.removeEventListener('mouseenter', updatePosition);
        parentElement.removeEventListener('mouseleave', () => setIsHovered(false));
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, []);

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 999999,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 p-5 min-w-[420px] max-w-[600px]" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
        {/* Header */}
        <div className="mb-4 pb-4 border-b-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-lg shadow-lg">
              {isL5 ? 'L5 프로세스' : isL6 ? 'L6 액티비티' : 'Task'}
            </span>
            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">{data.id}</span>
          </div>
          <h3 className="font-bold text-xl text-gray-900 mt-2">{data.name}</h3>
          {data.l4Category && (
            <div className="mt-2 text-sm text-gray-700">
              <span className="font-semibold text-gray-800">카테고리:</span> <span className="text-blue-600">{data.l4Category}</span>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-3">📊 리소스 정보</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-2.5 rounded-lg">
              <div className="text-xs text-blue-600 mb-1">필요인력</div>
              <div className="font-bold text-gray-900 text-base">{formatDecimal(data.필요인력)}명</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-2.5 rounded-lg">
              <div className="text-xs text-green-600 mb-1">필요기간</div>
              <div className="font-bold text-gray-900 text-base">{formatDecimal(data.필요기간)}주</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-2.5 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">MM</div>
              <div className="font-bold text-gray-900 text-base">{formatDecimal(data.MM)}</div>
            </div>
          </div>
          {'cumulativeMM' in data && data.cumulativeMM !== undefined && (
            <div className="mt-2 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-2.5 rounded-lg">
              <div className="text-xs text-orange-600 mb-1">누적 MM</div>
              <div className="font-bold text-gray-900 text-base">{formatDecimal(data.cumulativeMM)}</div>
            </div>
          )}
        </div>

        {/* Definition */}
        {data.정의 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">📝 정의</h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">{data.정의}</p>
          </div>
        )}

        {/* L5 Specific Information */}
        {isL5 && (
          <div className="mb-3 space-y-2">
            {'프로세스 오너부서(L5)' in data && data['프로세스 오너부서(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">프로세스 오너부서:</span>
                {renderPipeSeparatedValue(data['프로세스 오너부서(L5)'])}
              </div>
            )}
            {'산출물(L5)' in data && data['산출물(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">산출물:</span>
                {renderPipeSeparatedValue(data['산출물(L5)'])}
              </div>
            )}
            {'준수지표(L5)' in data && data['준수지표(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">준수지표:</span>
                {renderPipeSeparatedValue(data['준수지표(L5)'])}
              </div>
            )}
            {'소요기간(L5)' in data && data['소요기간(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">소요기간:</span>
                {renderPipeSeparatedValue(data['소요기간(L5)'])}
              </div>
            )}
            {'수행주기(L5)' in data && data['수행주기(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">수행주기:</span>
                {renderPipeSeparatedValue(data['수행주기(L5)'])}
              </div>
            )}
            {'참여(L5)' in data && data['참여(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">참여:</span>
                {renderPipeSeparatedValue(data['참여(L5)'])}
              </div>
            )}
            {'바로가기 URL(L5)' in data && data['바로가기 URL(L5)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">바로가기 URL:</span>
                <a href={data['바로가기 URL(L5)']} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all">
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
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">업무담당부서:</span>
                {renderPipeSeparatedValue(data['업무담당부서(L6)'])}
              </div>
            )}
            {'참여부서(L6)' in data && data['참여부서(L6)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">참여부서:</span>
                {renderPipeSeparatedValue(data['참여부서(L6)'])}
              </div>
            )}
            {'시스템' in data && data.시스템 && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">시스템:</span>
                {renderPipeSeparatedValue(data.시스템)}
              </div>
            )}
            {'작업방식(L6)' in data && data['작업방식(L6)'] && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">작업방식:</span>
                {renderPipeSeparatedValue(data['작업방식(L6)'])}
              </div>
            )}
            {'l5Parent' in data && data.l5Parent && (
              <div className="flex items-start">
                <span className="font-semibold text-xs text-gray-600 min-w-[100px]">상위 L5:</span>
                <span className="text-sm text-gray-800">{data.l5Parent}</span>
              </div>
            )}
          </div>
        )}

        {/* Predecessors and Successors */}
        {((data.predecessors && data.predecessors.length > 0) || (data.successors && data.successors.length > 0)) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">🔗 연결 관계</h4>
            {data.predecessors && data.predecessors.length > 0 && (
              <div className="mb-3">
                <span className="font-semibold text-xs text-gray-600">선행:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.predecessors.map((pred, idx) => {
                    // L6인 경우 "L5ID::L6ID"에서 L6ID만 추출
                    const displayText = isL6 && pred.includes('::') ? pred.split('::')[1] : pred;
                    return (
                      <span key={idx} className="inline-block px-2.5 py-1 bg-gray-100 text-xs text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors">
                        {displayText}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {data.successors && data.successors.length > 0 && (
              <div>
                <span className="font-semibold text-xs text-gray-600">후행:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.successors.map((succ, idx) => {
                    // L6인 경우 "L5ID::L6ID"에서 L6ID만 추출
                    const displayText = isL6 && succ.includes('::') ? succ.split('::')[1] : succ;
                    return (
                      <span key={idx} className="inline-block px-2.5 py-1 bg-gray-100 text-xs text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors">
                        {displayText}
                      </span>
                    );
                  })}
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
                <span className="font-semibold text-xs text-gray-600">선행 L5:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data['선행 L5'].map((l5, idx) => (
                    <span key={idx} className="inline-block px-2.5 py-1 bg-blue-50 text-xs text-blue-700 rounded-md border border-blue-200">
                      {l5}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {('후행 L5' in data && data['후행 L5'] && data['후행 L5'].length > 0) && (
              <div className="mt-3">
                <span className="font-semibold text-xs text-gray-600">후행 L5:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data['후행 L5'].map((l5, idx) => (
                    <span key={idx} className="inline-block px-2.5 py-1 bg-blue-50 text-xs text-blue-700 rounded-md border border-blue-200">
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
          <div className="mt-4 pt-4 border-t border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg border border-red-300">
            <div className="flex items-center text-red-700">
              <span className="text-lg mr-2">⚠️</span>
              <span className="font-semibold text-sm">양방향 연결 감지됨</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div ref={parentRef} style={{ position: 'absolute', pointerEvents: 'none' }} />
      {typeof window !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
}
