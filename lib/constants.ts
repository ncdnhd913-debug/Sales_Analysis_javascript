// ==============================================================================
// lib/constants.ts — 상수 및 공통 설정
// ==============================================================================

// ERP 엑셀 컬럼 인덱스 매핑 (0-based)
export const COL_IDX: Record<string, number> = {
  매출일: 3,
  매출처명: 8,
  품목코드: 21,
  품목명: 22,
  단위: 27,
  수량: 29,
  환종: 30,
  환율: 31,
  외화단가: 34,
  외화금액: 35,
  원화단가: 39,
  원화금액: 40,
  품목계정: 54,
};

// 월 한글 표기
export const MONTH_KR: Record<number, string> = {
  1: '1월', 2: '2월', 3: '3월', 4: '4월',
  5: '5월', 6: '6월', 7: '7월', 8: '8월',
  9: '9월', 10: '10월', 11: '11월', 12: '12월',
};

// 그룹 카드 색상 팔레트 (활성색, 배경색, 어두운색)
export const GROUP_COLORS = [
  { active: '#1e40af', light: '#dbeafe', dark: '#1e3a8a' }, // 파랑
  { active: '#7c3aed', light: '#ede9fe', dark: '#5b21b6' }, // 보라
  { active: '#065f46', light: '#d1fae5', dark: '#064e3b' }, // 초록
  { active: '#9a3412', light: '#fee2e2', dark: '#7c2d12' }, // 빨강
  { active: '#92400e', light: '#fef3c7', dark: '#78350f' }, // 노랑
  { active: '#0e7490', light: '#cffafe', dark: '#0c4a6e' }, // 청록
  { active: '#1d4ed8', light: '#dbeafe', dark: '#1e3a8a' }, // 남색
];

// 품목계정 분류
export const ACCOUNT_CATEGORIES = ['제품', '상품', '기타'] as const;
export const ACCOUNT_COLORS: Record<string, string> = {
  제품: '#1e40af',
  상품: '#065f46',
  기타: '#7c3aed',
};

// 차트 색상
export const CHART_COLORS = {
  base: '#6366f1',
  curr: '#38bdf8',
  up: '#34d399',
  down: '#f87171',
  connector: 'rgba(124,58,237,0.4)',
};

// 숫자 포맷팅 함수
export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR');
}

export function formatCurrency(value: number, unit: '원' | '백만원' = '원'): string {
  if (unit === '백만원') {
    return `${(value / 1_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}`;
  }
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
}

export function formatDiff(value: number, unit: '원' | '백만원' = '원'): string {
  const formatted = formatCurrency(Math.abs(value), unit);
  if (value > 0) return `▲ +${formatted}`;
  if (value < 0) return `▼ ${formatted}`;
  return formatted;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// 억원 포맷
export function formatBillion(value: number): string {
  return (value / 100_000_000).toLocaleString('ko-KR', { 
    minimumFractionDigits: 1,
    maximumFractionDigits: 1 
  });
}
