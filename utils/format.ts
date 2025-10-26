/**
 * 숫자를 소수점 3자리까지 포맷팅합니다.
 * 내부 데이터는 변경하지 않고 표시용으로만 사용합니다.
 *
 * @param value - 포맷팅할 숫자
 * @returns 소수점 3자리까지 반올림된 문자열 (불필요한 0은 제거)
 */
export function formatDecimal(value: number | undefined): string {
  if (value === undefined || value === null) return "0";

  // 소수점 2자리까지 반올림
  const rounded = Math.round(value * 100) / 100;

  // 불필요한 trailing zeros 제거
  return rounded.toString();
}
