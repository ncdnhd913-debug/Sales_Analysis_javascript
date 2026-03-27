'use client';

import { useDataStore } from '@/stores/useDataStore';
import { Sidebar } from '@/components/Sidebar';
import { KpiSummary } from '@/components/KpiSummary';
import { GroupSelector } from '@/components/GroupSelector';
import { GroupEditor } from '@/components/GroupEditor';
import { DataTable } from '@/components/DataTable';
import { ChartTabs } from '@/components/ChartTabs';
import { AccountAnalysis } from '@/components/AccountAnalysis';
import { AIAnalysis } from '@/components/AIAnalysis';
import { ModelGuide } from '@/components/ModelGuide';
import { RawDataViewer } from '@/components/RawDataViewer';
import { ModelBanner } from '@/components/ModelBanner';
import { SectionHeader, Expander } from '@/components/ui';

// 파일 업로드 안내 컴포넌트
function UploadGuide() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">매출 차이 분석</h1>
        <p className="text-foreground-muted mb-8">
          ERP 매출실적 파일을 업로드하여 수량, 단가, 환율 요인별 차이 분석을 시작하세요.
        </p>
        
        <Expander title="📋 엑셀 파일 컬럼 구성 안내" defaultOpen={false}>
          <div className="text-left">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-500/20">
                  <th className="py-2 text-left text-foreground-muted">열</th>
                  <th className="py-2 text-left text-foreground-muted">내용</th>
                </tr>
              </thead>
              <tbody className="text-foreground-muted">
                <tr className="border-b border-primary-500/10"><td className="py-1.5">D</td><td>매출일 (YYYY-MM-DD)</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">I</td><td>매출처명</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">V</td><td>품목코드</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">W</td><td>품목명</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">AB</td><td>단위</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">AD</td><td>수량</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">AE</td><td>환종 (KRW/USD)</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">AF</td><td>환율</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">AI</td><td>(외화) 판매단가</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">AJ</td><td>(외화) 판매금액</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">AN</td><td>(장부단가) 원화환산판매단가</td></tr>
                <tr className="border-b border-primary-500/10"><td className="py-1.5">AO</td><td>(장부금액) 원화환산판매금액</td></tr>
                <tr><td className="py-1.5">BC</td><td>품목계정 (제품/상품/원재료/부재료/제조-수선비)</td></tr>
              </tbody>
            </table>
          </div>
        </Expander>
      </div>
    </div>
  );
}

// 메인 대시보드 컴포넌트
function Dashboard() {
  const { rawData, summary } = useDataStore();

  // 품목계정 데이터 존재 여부
  const hasAccountData = rawData.some((r) => r.품목계정_분류);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* 타이틀 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">매출 차이 분석</h1>
        <p className="text-xs text-foreground-subtle uppercase tracking-wider mt-1">
          Variance Analysis Dashboard
        </p>
      </div>

      {/* 그룹 에디터 */}
      <GroupEditor />

      {/* 모델 배너 */}
      <ModelBanner />

      {/* 분석 대상 선택 */}
      <GroupSelector />

      {/* KPI 요약 */}
      <section>
        <SectionHeader icon="📈">종합 요약</SectionHeader>
        <KpiSummary />
      </section>

      {/* AI 분석 제언 */}
      <AIAnalysis />

      {/* 커스텀 그룹별 차이 분석 */}
      <section>
        <SectionHeader icon="📋">커스텀 그룹별 차이 분석</SectionHeader>
        <DataTable />
      </section>

      {/* 품목계정별 차이 분석 */}
      {hasAccountData && (
        <section>
          <SectionHeader icon="🗂️">품목계정별 차이 분석</SectionHeader>
          <p className="text-xs text-foreground-subtle mb-4">
            제품 / 상품 / 기타(원재료·부재료·제조-수선비) 기준 집계 — 각 탭은 커스텀 그룹 단위로 표시
          </p>
          <AccountAnalysis />
        </section>
      )}

      {/* 시각화 */}
      <ChartTabs />

      {/* 다운로드 및 원본 데이터 */}
      <section>
        <SectionHeader icon="⬇️">결과 다운로드</SectionHeader>
        <RawDataViewer />
      </section>

      {/* 모델 비교 가이드 */}
      <ModelGuide />
    </div>
  );
}

export default function Home() {
  const { rawData } = useDataStore();
  const hasData = rawData.length > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {hasData ? <Dashboard /> : <UploadGuide />}
    </div>
  );
}
