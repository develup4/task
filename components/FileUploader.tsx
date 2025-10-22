'use client';

import { useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { parseExcelFile } from '@/utils/excelParser';
import { resetColorMapping } from '@/utils/colors';

export default function FileUploader() {
  const { setProcessedData, setViewMode, setSelectedL5 } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        // 색상 매핑 초기화
        resetColorMapping();

        // 파일 파싱
        const data = await parseExcelFile(file);

        // Store에 데이터 저장
        setProcessedData(data);
        setViewMode('l5-all');
        setSelectedL5(null);

        alert('파일이 성공적으로 로드되었습니다!');
      } catch (error) {
        console.error('파일 파싱 에러:', error);
        alert('파일 로드 중 오류가 발생했습니다: ' + (error as Error).message);
      }

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [setProcessedData, setViewMode, setSelectedL5]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        className="px-5 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload
      </button>
    </div>
  );
}
