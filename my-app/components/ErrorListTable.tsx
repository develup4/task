'use client';

import { useAppStore } from '@/lib/store';

export default function ErrorListTable() {
  const { processedData } = useAppStore();

  if (!processedData || !processedData.errors || processedData.errors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">✅</div>
          <p>검증 오류가 없습니다</p>
        </div>
      </div>
    );
  }

  const errors = processedData.errors;

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              #
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              레벨
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              오류 유형
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              소스 프로세스
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              누락된 프로세스
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              설명
            </th>
          </tr>
        </thead>
        <tbody>
          {errors.map((error, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                {index + 1}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  error.sourceLevel === 'L5'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {error.sourceLevel}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  error.type === 'missing_predecessor'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {error.type === 'missing_predecessor' ? '누락된 선행' : '누락된 후행'}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700 font-mono">
                {error.sourceTask}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm text-red-600 font-mono font-semibold">
                {error.missingTask}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                {error.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 bg-gray-50 border-t border-gray-300 text-sm text-gray-600">
        총 <span className="font-semibold text-red-600">{errors.length}</span>개의 검증 오류가 발견되었습니다.
      </div>
    </div>
  );
}
