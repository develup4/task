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
        style={{
          padding: '10px 20px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1976D2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2196F3';
        }}
      >
        엑셀 파일 업로드
      </button>
    </div>
  );
}
