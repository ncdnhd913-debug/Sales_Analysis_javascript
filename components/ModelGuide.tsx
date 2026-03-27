'use client';

import { Expander } from './ui';

export function ModelGuide() {
  return (
    <Expander title="📖 모델 A vs 모델 B 상세 비교">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary-500/20">
              <th className="px-3 py-2 text-left font-semibold text-foreground w-24">구분</th>
              <th className="px-3 py-2 text-left font-semibold text-primary-300" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                모델 A — 원인별 임팩트 분석
              </th>
              <th className="px-3 py-2 text-left font-semibold text-orange-300" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
                모델 B — 활동별 증분 분석
              </th>
            </tr>
          </thead>
          <tbody className="text-foreground-muted">
            <tr className="border-b border-primary-500/10">
              <td className="px-3 py-3 font-medium text-foreground">용도</td>
              <td className="px-3 py-3">재무/감사 표준 보고</td>
              <td className="px-3 py-3">영업/전략 실행 보고</td>
            </tr>
            <tr className="border-b border-primary-500/10">
              <td className="px-3 py-3 font-medium text-foreground">핵심 특징</td>
              <td className="px-3 py-3">
                수량/단가/환율 효과 <strong className="text-primary-200">상호독립 분해</strong><br />
                <span className="text-xs text-foreground-subtle">→ 항등식 정확히 성립</span>
              </td>
              <td className="px-3 py-3">
                <strong className="text-orange-200">영업 활동 기여</strong> 중심 해석<br />
                <span className="text-xs text-foreground-subtle">→ 유리한 단가 적용</span>
              </td>
            </tr>
            <tr className="border-b border-primary-500/10">
              <td className="px-3 py-3 font-medium text-foreground">① 수량 차이</td>
              <td className="px-3 py-3 font-mono text-xs">
                <div className="text-primary-200">KRW: (Q1−Q0)×P0_krw</div>
                <div className="text-primary-200">USD: (Q1−Q0)×P0_fx×ER0</div>
              </td>
              <td className="px-3 py-3 font-mono text-xs">
                <div className="text-orange-200">Q↑: (Q1−Q0)×P1_krw</div>
                <div className="text-orange-200">Q↓: (Q1−Q0)×P0_krw</div>
              </td>
            </tr>
            <tr className="border-b border-primary-500/10">
              <td className="px-3 py-3 font-medium text-foreground">② 단가 차이</td>
              <td className="px-3 py-3 font-mono text-xs">
                <div className="text-primary-200">KRW: (P1_krw−P0_krw)×Q1</div>
                <div className="text-primary-200">USD: (P1_fx−P0_fx)×Q1×ER0</div>
              </td>
              <td className="px-3 py-3 font-mono text-xs">
                <div className="text-orange-200">총차이 − ① − ③</div>
                <span className="text-foreground-subtle">(Residual)</span>
              </td>
            </tr>
            <tr className="border-b border-primary-500/10">
              <td className="px-3 py-3 font-medium text-foreground">③ 환율 차이</td>
              <td className="px-3 py-3 font-mono text-xs">
                <div className="text-primary-200">KRW: 0</div>
                <div className="text-primary-200">USD: (ER1−ER0)×Q1×P1_fx</div>
              </td>
              <td className="px-3 py-3 font-mono text-xs">
                <div className="text-orange-200">KRW: 0</div>
                <div className="text-orange-200">USD: 4-Case 분기</div>
                <div className="text-foreground-subtle text-[10px] mt-1">
                  P↑Q↑: dER×Q0×P1<br />
                  P↑Q↓: dER×Q1×P1<br />
                  P↓Q↑: dER×Q0×P0<br />
                  P↓Q↓: dER×Q1×P0
                </div>
              </td>
            </tr>
            <tr className="border-b border-primary-500/10">
              <td className="px-3 py-3 font-medium text-foreground">항등식</td>
              <td className="px-3 py-3">
                <span className="text-success">✓ 항상 성립</span><br />
                <span className="text-xs font-mono">①+②+③ = 매출1−매출0</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-success">✓ 항상 성립</span><br />
                <span className="text-xs font-mono">①+②+③ = 매출1−매출0</span>
              </td>
            </tr>
            <tr className="border-b border-primary-500/10">
              <td className="px-3 py-3 font-medium text-foreground">신규 품목</td>
              <td className="px-3 py-3" colSpan={2}>
                Q0=0 → 매출1 전액을 ① 수량차이로 계상
              </td>
            </tr>
            <tr>
              <td className="px-3 py-3 font-medium text-foreground">단종 품목</td>
              <td className="px-3 py-3" colSpan={2}>
                Q1=0 → 매출0 전액을 ① 수량차이(−)로 계상
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
        <h4 className="font-semibold text-foreground mb-2">💡 모델 선택 가이드</h4>
        <ul className="text-sm text-foreground-muted space-y-1">
          <li>• <strong className="text-primary-200">모델 A</strong>: 외부 감사, 재무 보고, 정확한 요인 분해가 필요할 때</li>
          <li>• <strong className="text-orange-200">모델 B</strong>: 영업 성과 평가, 전략 수립, 실행 가능한 인사이트가 필요할 때</li>
        </ul>
      </div>
    </Expander>
  );
}
