'use client';

import { useDataStore } from '@/stores/useDataStore';

export function ModelBanner() {
  const { model } = useDataStore();
  const isModelA = model === 'A';

  if (isModelA) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/25 mb-4">
        <div
          className="w-1 h-9 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(180deg, #7c3aed, #a78bfa)' }}
        />
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground mb-0.5">
            모델 A — 원인별 임팩트 분석
          </div>
          <div className="text-[10px] text-foreground-subtle font-mono tracking-wide">
            ① (Q1−Q0)×P0_fx×ER0 │ ② (P1−P0)×Q1×ER0 │ ③ (ER1−ER0)×Q1×P1_fx
          </div>
        </div>
        <span className="text-[10px] font-semibold bg-primary-500/20 text-primary-200 border border-primary-500/30 rounded-md px-2.5 py-1 whitespace-nowrap tracking-wider">
          재무·감사 표준
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-4">
      <div
        className="w-1 h-9 rounded-full flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, #f97316, #fb923c)' }}
      />
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground mb-0.5">
          모델 B — 활동별 증분 분석
        </div>
        <div className="text-[10px] text-foreground-subtle font-mono tracking-wide">
          ① Q↑×P1_krw / Q↓×P0_krw │ ② 총차이−①−③ │ ③ P/Q 4-Case
        </div>
      </div>
      <span className="text-[10px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30 rounded-md px-2.5 py-1 whitespace-nowrap tracking-wider">
        영업·전략 보고
      </span>
    </div>
  );
}
