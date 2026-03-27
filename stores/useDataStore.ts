// ==============================================================================
// stores/useDataStore.ts — 전역 데이터 상태 관리
// ==============================================================================

import { create } from 'zustand';
import type {
  SalesRow,
  VarianceSummaryRow,
  VarianceDetailRow,
  PeriodSelection,
  AnalysisModel,
  AccountType,
  KpiData,
  AIAnalysisResult,
} from '@/lib/types';
import { parseExcelFile } from '@/lib/excel-parser';
import { runAnalysis, calculateKpis } from '@/lib/models';
import { getYears, getMonths, filterByPeriod, filterByAccountType } from '@/lib/utils';

interface DataState {
  // 원본 데이터
  rawData: SalesRow[];
  fileName: string;
  isLoading: boolean;
  error: string | null;

  // 기간 설정
  availableYears: number[];
  availableMonths: Record<number, number[]>;
  period: PeriodSelection;

  // 분석 설정
  model: AnalysisModel;
  accountTypes: AccountType[];
  showDetail: boolean;

  // 필터된 데이터
  baseData: SalesRow[];
  currData: SalesRow[];

  // 분석 결과
  summary: VarianceSummaryRow[];
  detail: VarianceDetailRow[];
  kpis: KpiData;

  // UI 상태
  waterfallUnit: '백만원' | '원';
  activeTab: 'waterfall' | 'bar';
  accountTab: '전체' | AccountType;

  // AI 분석
  aiResult: AIAnalysisResult;

  // 액션
  loadFile: (file: File) => Promise<void>;
  setPeriodMode: (mode: 'YoY' | 'MoM') => void;
  setIsYtd: (isYtd: boolean) => void;
  setCurrYear: (year: number) => void;
  setCurrMonth: (month: number) => void;
  setModel: (model: AnalysisModel) => void;
  setAccountTypes: (types: AccountType[]) => void;
  setShowDetail: (show: boolean) => void;
  setWaterfallUnit: (unit: '백만원' | '원') => void;
  setActiveTab: (tab: 'waterfall' | 'bar') => void;
  setAccountTab: (tab: '전체' | AccountType) => void;
  setAiResult: (result: AIAnalysisResult) => void;
  runAnalysis: () => void;
  reset: () => void;
}

const initialKpis: KpiData = {
  totalBase: 0,
  totalCurr: 0,
  totalDiff: 0,
  qtyVariance: 0,
  priceVariance: 0,
  fxVariance: 0,
  growthPct: 0,
  qtyPct: 0,
  pricePct: 0,
  fxPct: 0,
  allKrw: true,
};

const initialPeriod: PeriodSelection = {
  mode: 'YoY',
  isYtd: false,
  baseYear: 0,
  baseMonth: 0,
  currYear: 0,
  currMonth: 0,
  baseLabel: '',
  currLabel: '',
};

export const useDataStore = create<DataState>((set, get) => ({
  // 초기 상태
  rawData: [],
  fileName: '',
  isLoading: false,
  error: null,
  availableYears: [],
  availableMonths: {},
  period: initialPeriod,
  model: 'A',
  accountTypes: ['제품', '상품', '기타'],
  showDetail: false,
  baseData: [],
  currData: [],
  summary: [],
  detail: [],
  kpis: initialKpis,
  waterfallUnit: '백만원',
  activeTab: 'waterfall',
  accountTab: '전체',
  aiResult: { status: 'idle', content: '', paramKey: '' },

  // 파일 로드
  loadFile: async (file) => {
    set({ isLoading: true, error: null });

    try {
      const data = await parseExcelFile(file);
      const years = getYears(data);
      const months: Record<number, number[]> = {};
      for (const year of years) {
        months[year] = getMonths(data, year);
      }

      // 기본 기간 설정: 가장 최근 연도/월
      const currYear = years[0] || new Date().getFullYear();
      const currMonth = months[currYear]?.[months[currYear].length - 1] || 1;
      const baseYear = currYear - 1;
      const baseMonth = currMonth;

      const period: PeriodSelection = {
        mode: 'YoY',
        isYtd: false,
        baseYear,
        baseMonth,
        currYear,
        currMonth,
        baseLabel: `${baseYear}.${String(baseMonth).padStart(2, '0')}`,
        currLabel: `${currYear}.${String(currMonth).padStart(2, '0')}`,
      };

      set({
        rawData: data,
        fileName: file.name,
        availableYears: years,
        availableMonths: months,
        period,
        isLoading: false,
      });

      // 분석 실행
      get().runAnalysis();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '파일 로드 실패',
      });
    }
  },

  // 기간 모드 변경
  setPeriodMode: (mode) => {
    const { period, availableMonths } = get();
    let baseYear: number;
    let baseMonth: number;

    if (mode === 'YoY') {
      baseYear = period.currYear - 1;
      baseMonth = period.currMonth;
    } else {
      baseYear = period.currYear;
      baseMonth = period.currMonth - 1;
      if (baseMonth < 1) {
        baseYear -= 1;
        const months = availableMonths[baseYear] || [];
        baseMonth = months[months.length - 1] || 12;
      }
    }

    const newPeriod: PeriodSelection = {
      ...period,
      mode,
      baseYear,
      baseMonth,
      baseLabel: period.isYtd
        ? `${baseYear}.01~${String(baseMonth).padStart(2, '0')}`
        : `${baseYear}.${String(baseMonth).padStart(2, '0')}`,
    };

    set({ period: newPeriod });
    get().runAnalysis();
  },

  // YTD 토글
  setIsYtd: (isYtd) => {
    const { period } = get();
    const newPeriod: PeriodSelection = {
      ...period,
      isYtd,
      baseLabel: isYtd
        ? `${period.baseYear}.01~${String(period.baseMonth).padStart(2, '0')}`
        : `${period.baseYear}.${String(period.baseMonth).padStart(2, '0')}`,
      currLabel: isYtd
        ? `${period.currYear}.01~${String(period.currMonth).padStart(2, '0')}`
        : `${period.currYear}.${String(period.currMonth).padStart(2, '0')}`,
    };
    set({ period: newPeriod });
    get().runAnalysis();
  },

  // 실적 연도 변경
  setCurrYear: (year) => {
    const { period, availableMonths } = get();
    const months = availableMonths[year] || [];
    const currMonth = months.includes(period.currMonth)
      ? period.currMonth
      : months[months.length - 1] || 1;

    let baseYear: number;
    let baseMonth: number;

    if (period.mode === 'YoY') {
      baseYear = year - 1;
      baseMonth = currMonth;
    } else {
      baseYear = year;
      baseMonth = currMonth - 1;
      if (baseMonth < 1) {
        baseYear -= 1;
        const bMonths = availableMonths[baseYear] || [];
        baseMonth = bMonths[bMonths.length - 1] || 12;
      }
    }

    const newPeriod: PeriodSelection = {
      ...period,
      currYear: year,
      currMonth,
      baseYear,
      baseMonth,
      baseLabel: period.isYtd
        ? `${baseYear}.01~${String(baseMonth).padStart(2, '0')}`
        : `${baseYear}.${String(baseMonth).padStart(2, '0')}`,
      currLabel: period.isYtd
        ? `${year}.01~${String(currMonth).padStart(2, '0')}`
        : `${year}.${String(currMonth).padStart(2, '0')}`,
    };

    set({ period: newPeriod });
    get().runAnalysis();
  },

  // 실적 월 변경
  setCurrMonth: (month) => {
    const { period, availableMonths } = get();

    let baseYear: number;
    let baseMonth: number;

    if (period.mode === 'YoY') {
      baseYear = period.currYear - 1;
      baseMonth = month;
    } else {
      baseYear = period.currYear;
      baseMonth = month - 1;
      if (baseMonth < 1) {
        baseYear -= 1;
        const months = availableMonths[baseYear] || [];
        baseMonth = months[months.length - 1] || 12;
      }
    }

    const newPeriod: PeriodSelection = {
      ...period,
      currMonth: month,
      baseYear,
      baseMonth,
      baseLabel: period.isYtd
        ? `${baseYear}.01~${String(baseMonth).padStart(2, '0')}`
        : `${baseYear}.${String(baseMonth).padStart(2, '0')}`,
      currLabel: period.isYtd
        ? `${period.currYear}.01~${String(month).padStart(2, '0')}`
        : `${period.currYear}.${String(month).padStart(2, '0')}`,
    };

    set({ period: newPeriod });
    get().runAnalysis();
  },

  // 모델 변경
  setModel: (model) => {
    set({ model });
    get().runAnalysis();
  },

  // 품목계정 필터 변경
  setAccountTypes: (types) => {
    set({ accountTypes: types });
    get().runAnalysis();
  },

  // 상세 표시 토글
  setShowDetail: (show) => {
    set({ showDetail: show });
  },

  // Waterfall 단위 변경
  setWaterfallUnit: (unit) => {
    set({ waterfallUnit: unit });
  },

  // 활성 탭 변경
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  // 품목계정 탭 변경
  setAccountTab: (tab) => {
    set({ accountTab: tab });
  },

  // AI 결과 설정
  setAiResult: (result) => {
    set({ aiResult: result });
  },

  // 분석 실행
  runAnalysis: () => {
    const { rawData, period, model, accountTypes } = get();

    if (rawData.length === 0) return;

    // 기간 필터링
    const baseFiltered = filterByPeriod(
      rawData,
      period.baseYear,
      period.baseMonth,
      period.isYtd
    );
    const currFiltered = filterByPeriod(
      rawData,
      period.currYear,
      period.currMonth,
      period.isYtd
    );

    // 품목계정 필터링
    const baseData = filterByAccountType(baseFiltered, accountTypes);
    const currData = filterByAccountType(currFiltered, accountTypes);

    // 분석 실행
    const { summary, detail } = runAnalysis(baseData, currData, model);

    // KPI 계산
    const kpis = calculateKpis(summary);

    set({
      baseData,
      currData,
      summary,
      detail,
      kpis,
    });
  },

  // 초기화
  reset: () => {
    set({
      rawData: [],
      fileName: '',
      isLoading: false,
      error: null,
      availableYears: [],
      availableMonths: {},
      period: initialPeriod,
      baseData: [],
      currData: [],
      summary: [],
      detail: [],
      kpis: initialKpis,
      aiResult: { status: 'idle', content: '', paramKey: '' },
    });
  },
}));
