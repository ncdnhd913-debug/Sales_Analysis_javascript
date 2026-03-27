// ==============================================================================
// lib/models.ts — 차이 분석 핵심 계산 로직 (원본 Python 코드 정확히 포팅)
// ==============================================================================

import type {
  SalesRow,
  AggregatedRow,
  VarianceDetailRow,
  VarianceSummaryRow,
  KpiData,
} from './types';
import { sum, weightedAverage, groupBy } from './utils';

// ── 집계 함수 ─────────────────────────────────────────────────────────────────

/**
 * [품목명 × 환종] 기준 분리 집계.
 *
 * 핵심 설계 원칙:
 *   - KRW 거래와 USD(외화) 거래를 절대 혼합하지 않음
 *   - KRW행 : P_krw = 원화단가 가중평균,  P_fx = null,  ER = null
 *   - USD행 : P_fx  = 외화단가 가중평균,  P_krw = 원화단가 가중평균,
 *             ER    = 원화매출합 / 외화금액합  (항등식 Q·P_fx·ER = 원화매출 보장)
 */
export function aggregate(data: SalesRow[]): AggregatedRow[] {
  if (data.length === 0) return [];

  const grouped = groupBy(data, (row) => `${row.품목명}|||${row.환종.toUpperCase()}`);
  const rows: AggregatedRow[] = [];

  for (const [key, group] of Object.entries(grouped)) {
    const [품목명, 환종] = key.split('|||');
    const isKrw = 환종 === 'KRW';

    const Q = sum(group.map((r) => r.수량));
    const rev = sum(group.map((r) => r.원화금액));

    if (Q === 0) continue;

    const P_krw = weightedAverage(
      group.map((r) => r.원화단가),
      group.map((r) => r.수량)
    );

    let P_fx: number | null = null;
    let ER: number | null = null;

    if (!isKrw) {
      P_fx = weightedAverage(
        group.map((r) => r.외화단가),
        group.map((r) => r.수량)
      );
      let fxAmtSum = sum(group.map((r) => r.외화금액));
      if (fxAmtSum === 0) {
        fxAmtSum = Q * P_fx;
      }
      ER = fxAmtSum !== 0 ? rev / fxAmtSum : null;
    }

    rows.push({
      품목명,
      환종,
      Q,
      P_fx,
      P_krw,
      ER,
      원화매출: rev,
      is_krw: isKrw,
    });
  }

  return rows;
}

// ── 기준/실적 병합 ────────────────────────────────────────────────────────────

interface MergedRow {
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
  is_krw: boolean;
}

/**
 * 기준/실적 집계 후 [품목명 × 환종] outer merge.
 * 신규(Q0=0) / 단종(Q1=0) 케이스도 자동 포함.
 */
function mergeBaseCurr(baseData: SalesRow[], currData: SalesRow[]): MergedRow[] {
  const baseAgg = aggregate(baseData);
  const currAgg = aggregate(currData);

  // Map으로 변환
  const baseMap = new Map<string, AggregatedRow>();
  for (const row of baseAgg) {
    baseMap.set(`${row.품목명}|||${row.환종}`, row);
  }

  const currMap = new Map<string, AggregatedRow>();
  for (const row of currAgg) {
    currMap.set(`${row.품목명}|||${row.환종}`, row);
  }

  // 모든 키 수집 (outer join)
  const allKeys = new Set<string>();
  for (const key of baseMap.keys()) allKeys.add(key);
  for (const key of currMap.keys()) allKeys.add(key);

  const result: MergedRow[] = [];

  for (const key of allKeys) {
    const [품목명, 환종] = key.split('|||');
    const b = baseMap.get(key);
    const c = currMap.get(key);

    result.push({
      품목명,
      환종,
      Q0: b?.Q ?? 0,
      Q1: c?.Q ?? 0,
      P0_fx: b?.P_fx ?? null,
      P1_fx: c?.P_fx ?? null,
      P0_krw: b?.P_krw ?? 0,
      P1_krw: c?.P_krw ?? 0,
      ER0: b?.ER ?? null,
      ER1: c?.ER ?? null,
      매출0: b?.원화매출 ?? 0,
      매출1: c?.원화매출 ?? 0,
      is_krw: (b?.is_krw ?? true) || (c?.is_krw ?? true),
    });
  }

  return result;
}

// ── 품목명 단위 요약 ──────────────────────────────────────────────────────────

function summarizeByItem(details: VarianceDetailRow[]): VarianceSummaryRow[] {
  const grouped = groupBy(details, (r) => r.품목명);
  const result: VarianceSummaryRow[] = [];

  for (const [품목명, rows] of Object.entries(grouped)) {
    result.push({
      품목명,
      Q0: sum(rows.map((r) => r.Q0)),
      Q1: sum(rows.map((r) => r.Q1)),
      매출0: sum(rows.map((r) => r.매출0)),
      매출1: sum(rows.map((r) => r.매출1)),
      총차이: sum(rows.map((r) => r.총차이)),
      수량차이: sum(rows.map((r) => r.수량차이)),
      단가차이: sum(rows.map((r) => r.단가차이)),
      환율차이: sum(rows.map((r) => r.환율차이)),
      is_krw: rows.every((r) => r.is_krw),
    });
  }

  return result;
}

// ── 모델 A: 원인별 임팩트 분석 ─────────────────────────────────────────────────

/**
 * 원인별 임팩트 분석 — 재무/감사용 표준 모델
 *
 * KRW:  ①(Q1−Q0)×P0_krw  ②(P1_krw−P0_krw)×Q1  ③0
 * USD:  ①(Q1−Q0)×P0_fx×ER0  ②(P1_fx−P0_fx)×Q1×ER0  ③(ER1−ER0)×Q1×P1_fx
 *       항등식: ①+②+③ = 매출1 − 매출0  (항상 성립)
 *
 * 신규(Q0=0) → 매출1 전액 → ①,  단종(Q1=0) → 매출0 전액 → ①(-)
 */
export function modelA(
  baseData: SalesRow[],
  currData: SalesRow[]
): { summary: VarianceSummaryRow[]; detail: VarianceDetailRow[] } {
  const merged = mergeBaseCurr(baseData, currData);
  const details: VarianceDetailRow[] = [];

  for (const row of merged) {
    let 수량차이: number;
    let 단가차이: number;
    let 환율차이: number;

    if (row.Q0 === 0) {
      // 신규 품목
      수량차이 = row.매출1;
      단가차이 = 0;
      환율차이 = 0;
    } else if (row.Q1 === 0) {
      // 단종 품목
      수량차이 = -row.매출0;
      단가차이 = 0;
      환율차이 = 0;
    } else if (row.is_krw) {
      // KRW
      수량차이 = (row.Q1 - row.Q0) * row.P0_krw;
      단가차이 = (row.P1_krw - row.P0_krw) * row.Q1;
      환율차이 = 0;
    } else {
      // USD (외화)
      const P0_fx = row.P0_fx ?? 0;
      const P1_fx = row.P1_fx ?? 0;
      const ER0 = row.ER0 ?? 1;
      const ER1 = row.ER1 ?? 1;

      수량차이 = (row.Q1 - row.Q0) * P0_fx * ER0;
      단가차이 = (P1_fx - P0_fx) * row.Q1 * ER0;
      환율차이 = (ER1 - ER0) * row.Q1 * P1_fx;
    }

    const 총차이 = row.매출1 - row.매출0;

    // 부동소수점 잔차 흡수
    if (Math.abs(수량차이 + 단가차이 + 환율차이 - 총차이) > 1) {
      단가차이 += 총차이 - (수량차이 + 단가차이 + 환율차이);
    }

    details.push({
      품목명: row.품목명,
      환종: row.환종,
      Q0: row.Q0,
      Q1: row.Q1,
      P0_fx: row.P0_fx,
      P1_fx: row.P1_fx,
      P0_krw: row.P0_krw,
      P1_krw: row.P1_krw,
      ER0: row.ER0,
      ER1: row.ER1,
      매출0: row.매출0,
      매출1: row.매출1,
      총차이,
      수량차이,
      단가차이,
      환율차이,
      is_krw: row.is_krw,
    });
  }

  return {
    summary: summarizeByItem(details),
    detail: details,
  };
}

// ── 모델 B: 활동별 증분 분석 ──────────────────────────────────────────────────

/**
 * 활동별 증분 분석 — 영업/전략 보고용 모델
 *
 * ① 수량차이: Q↑→(Q1−Q0)×P1_krw  /  Q↓→(Q1−Q0)×P0_krw
 * ③ 환율차이: P/Q 방향 4-Case 분기  (KRW=0)
 * ② 단가차이: 총차이 − ① − ③  (Residual)
 */
export function modelB(
  baseData: SalesRow[],
  currData: SalesRow[]
): { summary: VarianceSummaryRow[]; detail: VarianceDetailRow[] } {
  const merged = mergeBaseCurr(baseData, currData);
  const details: VarianceDetailRow[] = [];

  for (const row of merged) {
    let 수량차이: number;
    let 단가차이: number;
    let 환율차이: number;

    if (row.Q0 === 0) {
      // 신규 품목
      수량차이 = row.매출1;
      단가차이 = 0;
      환율차이 = 0;
    } else if (row.Q1 === 0) {
      // 단종 품목
      수량차이 = -row.매출0;
      단가차이 = 0;
      환율차이 = 0;
    } else {
      const 총차이 = row.매출1 - row.매출0;
      const qUp = row.Q1 >= row.Q0;

      // ① 수량차이
      수량차이 = (row.Q1 - row.Q0) * (qUp ? row.P1_krw : row.P0_krw);

      if (row.is_krw) {
        // KRW: 환율차이 없음
        환율차이 = 0;
        단가차이 = 총차이 - 수량차이;
      } else {
        // USD: 4-Case 분기
        const P0_fx = row.P0_fx ?? 0;
        const P1_fx = row.P1_fx ?? 0;
        const ER0 = row.ER0 ?? 1;
        const ER1 = row.ER1 ?? 1;
        const dER = ER1 - ER0;
        const pUp = P1_fx >= P0_fx;

        if (pUp && qUp) {
          환율차이 = dER * row.Q0 * P1_fx;
        } else if (pUp && !qUp) {
          환율차이 = dER * row.Q1 * P1_fx;
        } else if (!pUp && qUp) {
          환율차이 = dER * row.Q0 * P0_fx;
        } else {
          환율차이 = dER * row.Q1 * P0_fx;
        }

        단가차이 = 총차이 - 수량차이 - 환율차이;
      }
    }

    const 총차이 = row.매출1 - row.매출0;

    details.push({
      품목명: row.품목명,
      환종: row.환종,
      Q0: row.Q0,
      Q1: row.Q1,
      P0_fx: row.P0_fx,
      P1_fx: row.P1_fx,
      P0_krw: row.P0_krw,
      P1_krw: row.P1_krw,
      ER0: row.ER0,
      ER1: row.ER1,
      매출0: row.매출0,
      매출1: row.매출1,
      총차이,
      수량차이,
      단가차이,
      환율차이,
      is_krw: row.is_krw,
    });
  }

  return {
    summary: summarizeByItem(details),
    detail: details,
  };
}

// ── 분석 실행 (모델 선택) ─────────────────────────────────────────────────────

export function runAnalysis(
  baseData: SalesRow[],
  currData: SalesRow[],
  model: 'A' | 'B'
): { summary: VarianceSummaryRow[]; detail: VarianceDetailRow[] } {
  return model === 'A' ? modelA(baseData, currData) : modelB(baseData, currData);
}

// ── KPI 계산 ──────────────────────────────────────────────────────────────────

export function calculateKpis(
  summary: VarianceSummaryRow[],
  selectedItems?: string[]
): KpiData {
  const filtered = selectedItems
    ? summary.filter((r) => selectedItems.includes(r.품목명))
    : summary;

  const totalBase = sum(filtered.map((r) => r.매출0));
  const totalCurr = sum(filtered.map((r) => r.매출1));
  const totalDiff = sum(filtered.map((r) => r.총차이));
  const qtyVariance = sum(filtered.map((r) => r.수량차이));
  const priceVariance = sum(filtered.map((r) => r.단가차이));
  const fxVariance = sum(filtered.map((r) => r.환율차이));
  const allKrw = filtered.every((r) => r.is_krw);

  return {
    totalBase,
    totalCurr,
    totalDiff,
    qtyVariance,
    priceVariance,
    fxVariance,
    growthPct: totalBase !== 0 ? (totalDiff / totalBase) * 100 : 0,
    qtyPct: totalBase !== 0 ? (qtyVariance / Math.abs(totalBase)) * 100 : 0,
    pricePct: totalBase !== 0 ? (priceVariance / Math.abs(totalBase)) * 100 : 0,
    fxPct: totalBase !== 0 ? (fxVariance / Math.abs(totalBase)) * 100 : 0,
    allKrw,
  };
}
