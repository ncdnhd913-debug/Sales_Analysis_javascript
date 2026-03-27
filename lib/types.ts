// ==============================================================================
// lib/types.ts — 완전한 타입 정의
// ==============================================================================

// ERP 원본 데이터 행
export interface SalesRow {
  매출일: Date;
  매출처명: string;
  품목코드: string;
  품목명: string;
  단위: string;
  수량: number;
  환종: string;
  환율: number;
  외화단가: number;
  외화금액: number;
  원화단가: number;
  원화금액: number;
  품목계정: string;
  품목계정_분류: '제품' | '상품' | '기타';
  연도: number;
  월: number;
}

// 집계된 행 (품목명 x 환종)
export interface AggregatedRow {
  품목명: string;
  환종: string;
  Q: number;
  P_fx: number | null;
  P_krw: number;
  ER: number | null;
  원화매출: number;
  is_krw: boolean;
}

// 차이 분석 상세 행 (환종별)
export interface VarianceDetailRow {
  품목명: string;
  환종: string;
  Q0: number;
  Q1: number;
  P0_fx: number | null;
  P1_fx: number | null;
  P0_krw: number;
  P1_krw: number;
  ER0: number | null;
  ER1: number | null;
  매출0: number;
  매출1: number;
  총차이: number;
  수량차이: number;
  단가차이: number;
  환율차이: number;
  is_krw: boolean;
}

// 차이 분석 요약 행 (품목명 단위)
export interface VarianceSummaryRow {
  품목명: string;
  Q0: number;
  Q1: number;
  매출0: number;
  매출1: number;
  총차이: number;
  수량차이: number;
  단가차이: number;
  환율차이: number;
  is_krw: boolean;
}

// 기간 선택
export interface PeriodSelection {
  mode: 'YoY' | 'MoM';
  isYtd: boolean;
  baseYear: number;
  baseMonth: number;
  currYear: number;
  currMonth: number;
  baseLabel: string;
  currLabel: string;
}

// 분석 모델
export type AnalysisModel = 'A' | 'B';

// 품목계정 분류
export type AccountType = '제품' | '상품' | '기타';

// 그룹 매핑
export interface GroupMapping {
  [itemName: string]: string;
}

// 그룹 구조
export interface Groups {
  [groupName: string]: string[];
}

// KPI 데이터
export interface KpiData {
  totalBase: number;
  totalCurr: number;
  totalDiff: number;
  qtyVariance: number;
  priceVariance: number;
  fxVariance: number;
  growthPct: number;
  qtyPct: number;
  pricePct: number;
  fxPct: number;
  allKrw: boolean;
}

// Waterfall 데이터
export interface WaterfallData {
  labels: string[];
  values: number[];
  bases: number[];
  colors: string[];
  texts: string[];
}

// 그룹 색상
export interface GroupColor {
  active: string;
  light: string;
  dark: string;
}

// 그룹별 통계
export interface GroupStats {
  groupName: string;
  itemCount: number;
  items: string[];
  baseRevenue: number;
  currRevenue: number;
  totalDiff: number;
  qtyVariance: number;
  priceVariance: number;
  fxVariance: number;
}

// 품목계정별 통계
export interface AccountStats {
  accountType: AccountType;
  baseRevenue: number;
  currRevenue: number;
  totalDiff: number;
  qtyVariance: number;
  priceVariance: number;
  fxVariance: number;
}

// AI 분석 결과
export interface AIAnalysisResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  content: string;
  paramKey: string;
}

// 테이블 정렬
export interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc';
}

// 앱 상태
export interface AppState {
  // 데이터
  rawData: SalesRow[];
  fileName: string;
  
  // 기간
  period: PeriodSelection;
  
  // 분석 설정
  model: AnalysisModel;
  accountTypes: AccountType[];
  showDetail: boolean;
  
  // 분석 결과
  summary: VarianceSummaryRow[];
  detail: VarianceDetailRow[];
  kpis: KpiData;
  
  // UI 상태
  waterfallUnit: '백만원' | '원';
  activeTab: 'waterfall' | 'bar';
  accountTab: '전체' | AccountType;
}
