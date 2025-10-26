"use client";

export default function HelpGuide() {
  return (
    <div className="h-full overflow-auto bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          📖 사용 가이드
        </h1>

        {/* 시작하기 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📁</span>
            <span>시작하기</span>
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                좌측 상단의 <strong>"Excel 파일 선택"</strong> 버튼을 클릭합니다
              </li>
              <li>DTF 양식에 맞는 엑셀 파일을 선택합니다</li>
              <li>파일이 자동으로 분석되어 그래프가 생성됩니다</li>
            </ol>
            <div className="mt-3 p-3 bg-white rounded border border-blue-100">
              <p className="text-sm text-gray-600">
                💡 <strong>파일 형식:</strong> 1행은 무시, 2행이 컬럼명, 3행부터
                데이터
              </p>
            </div>
          </div>
        </section>

        {/* 그래프 조작 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🖱️</span>
            <span>그래프 조작하기</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <h3 className="font-bold text-purple-900 mb-2">🔍 줌 인/아웃</h3>
              <p className="text-sm text-purple-800">
                마우스 휠을 위/아래로 스크롤
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-900 mb-2">🤚 화면 이동</h3>
              <p className="text-sm text-green-800">빈 영역을 드래그</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <h3 className="font-bold text-orange-900 mb-2">📦 노드 이동</h3>
              <p className="text-sm text-orange-800">
                노드를 드래그하여 위치 조정
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">ℹ️ 상세 정보</h3>
              <p className="text-sm text-blue-800">
                노드에 마우스를 올리면 툴팁 표시
              </p>
            </div>
          </div>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-yellow-900 mb-2">⚡ 고급 기능</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>
                <strong>한 번 클릭:</strong> L6 액티비티 보기
              </li>
              <li>
                <strong>더블클릭:</strong> 선택한 프로세스와 연결된 노드만 보기
                (필터링 모드)
              </li>
              <li>
                <strong>전체 보기 버튼:</strong> 필터링 모드 해제
              </li>
            </ul>
          </div>
        </section>

        {/* 필터 및 검색 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔍</span>
            <span>필터 및 검색</span>
          </h2>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-900 mb-2">👥 팀 필터</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                <li>우측 상단 "팀 선택" 버튼 클릭</li>
                <li>원하는 팀 선택 (여러 개 가능)</li>
                <li>"적용" 버튼 클릭</li>
                <li>"초기화" 버튼으로 전체 보기</li>
              </ol>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">🔎 텍스트 검색</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>우측 상단 검색창에 키워드 입력</li>
                <li>일치하는 노드가 노란색으로 하이라이트</li>
                <li>대소문자 구분 없이 검색</li>
              </ol>
            </div>
          </div>
        </section>

        {/* 오류 확인 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚠️</span>
            <span>에러 리포트</span>
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 mb-3">
              데이터 품질 문제를 자동으로 탐지합니다. 오류 행을 클릭하면 해당
              위치로 이동합니다.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200">
                  대소문자 오류
                </span>
                <span className="text-sm text-gray-700">
                  ID 입력 시 대소문자 불일치
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded border border-orange-200">
                  누락된 선행
                </span>
                <span className="text-sm text-gray-700">
                  참조되지만 존재하지 않는 선행 프로세스
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded border border-purple-200">
                  누락된 후행
                </span>
                <span className="text-sm text-gray-700">
                  참조되지만 존재하지 않는 후행 프로세스
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded border border-red-200">
                  양방향 오류
                </span>
                <span className="text-sm text-gray-700">
                  서로를 선행/후행으로 참조하는 순환 관계
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded border border-pink-200">
                  선행/후행 불일치
                </span>
                <span className="text-sm text-gray-700">관계 정보 불일치</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded border border-yellow-200">
                  입력 누락
                </span>
                <span className="text-sm text-gray-700">
                  선행/후행이 비어있지만 참조됨
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MM 테이블 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>MM 테이블</span>
          </h2>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800 mb-3">
              시작 노드(선행이 없는 프로세스)의 리소스 정보를 확인할 수
              있습니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
              <li>컬럼 헤더를 클릭하여 정렬</li>
              <li>누적 MM으로 프로젝트 전체 규모 파악</li>
              <li>필요인력, 필요기간, MM 정보 확인</li>
            </ul>
          </div>
        </section>

        {/* 유용한 팁 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>유용한 팁</span>
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-1">
                복잡한 그래프 다루기
              </h3>
              <p className="text-sm text-blue-800">
                줌 아웃 → 팀 필터 → L5 필터링 모드(더블클릭) → 검색 순으로
                활용하세요
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-1">
                엑셀 파일 작성 팁
              </h3>
              <p className="text-sm text-green-800">
                여러 값은 파이프(|)로 구분하고, 선행/후행은 한쪽만 입력해도 자동
                동기화됩니다
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-1">툴팁 활용</h3>
              <p className="text-sm text-purple-800">
                툴팁은 화면에 맞게 자동으로 위치가 조정됩니다. 파이프로 구분된
                값은 태그로 표시됩니다
              </p>
            </div>
          </div>
        </section>

        {/* 문제 해결 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>❓</span>
            <span>문제 해결</span>
          </h2>
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Q. 그래프가 표시되지 않아요
              </h3>
              <p className="text-sm text-gray-700">
                엑셀 파일의 2행이 컬럼명인지, Level 컬럼에 L5 또는 L6 값이
                있는지 확인하세요
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Q. 노드들이 겹쳐서 보여요
              </h3>
              <p className="text-sm text-gray-700">
                노드를 드래그하여 재배치하거나, 줌을 조정하거나, L5 필터링
                모드를 사용하세요
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Q. 오류가 너무 많이 나와요
              </h3>
              <p className="text-sm text-gray-700">
                대소문자를 정확히 입력하고, 양방향 관계는 한쪽만 입력하세요
                (자동 동기화됨)
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>DTF (Digital Transformation Flow) 시각화 도구</p>
        </div>
      </div>
    </div>
  );
}
