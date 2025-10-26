"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { parseExcelFile } from "@/utils/excelParser";
import { resetColorMapping } from "@/utils/colors";

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
        setViewMode("l5-all");
        setSelectedL5(null);
      } catch (error) {
        console.error("파일 파싱 에러:", error);
        alert("파일 로드 중 오류가 발생했습니다: " + (error as Error).message);
      }

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
        style={{ display: "none" }}
      />
      <button
        onClick={handleClick}
        className="px-5 py-2.5 bg-[#38BDF8] text-white rounded-lg hover:bg--[#38BDF8]/80 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer"
      >
        UPLOAD
      </button>
    </div>
  );
}
