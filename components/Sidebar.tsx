'use client';

import { useDataStore } from '@/stores/useDataStore';
import { FileUploader } from './FileUploader';
import { Select, RadioGroup, Checkbox, Badge } from './ui';
import { MONTH_KR } from '@/lib/constants';
import type { AccountType } from '@/lib/types';

export function Sidebar() {
  const {
    rawData,
    availableYears,
    availableMonths,
    period,
    model,
    accountTypes,
    showDetail,
    setPeriodMode,
    setIsYtd,
    setCurrYear,
    setCurrMonth,
    setModel,
    setAccountTypes,
    setShowDetail,
  } = useDataStore();

  const hasData = rawData.length > 0;
  const currMonths = availableMonths[period.currYear] || [];

  const handleAccountTypeToggle = (type: AccountType) => {
    if (accountTypes.includes(type)) {
      if (accountTypes.length > 1) {
        setAccountTypes(accountTypes.filter((t) => t !== type));
      }
    } else {
      setAccountTypes([...accountTypes, type]);
    }
  };

  return (
    <aside className="w-72 min-h-screen bg-[#13132a] border-r border-primary-500/15 p-4 flex flex-col gap-5 overflow-y-auto">
      {/* 로고 */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-2xl">📊</span>
        <div>
          <h1 className="text-sm font-bold text-foreground">매출 차이 분석</h1>
          <p className="text-[10px] text-foreground-subtle tracking-wider uppercase">Variance Analysis</p>
        </div>
      </div>

      {/* 파일 업로드 */}
      <section>
        <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
          데이터 파일
        </label>
        <FileUploader />
      </section>

      {hasData && (
        <>
          {/* 비교 방식 */}
          <section>
            <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
              비교 방식
            </label>
            <RadioGroup
              name="periodMode"
              value={period.mode}
              onChange={(v) => setPeriodMode(v as 'YoY' | 'MoM')}
              options={[
                { value: 'YoY', label: '전년 동월 대비 (YoY)' },
                { value: 'MoM', label: '전월 대비 (MoM)' },
              ]}
            />
            <div className="mt-2">
              <Checkbox
                label="YTD 누적 비교"
                checked={period.isYtd}
                onChange={(e) => setIsYtd(e.target.checked)}
              />
            </div>
          </section>

          {/* 실적 기간 */}
          <section>
            <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
              실적 기간
            </label>
            <div className="flex gap-2">
              <Select
                value={period.currYear}
                onChange={(e) => setCurrYear(Number(e.target.value))}
                options={availableYears.map((y) => ({ value: y, label: `${y}년` }))}
                className="flex-1"
              />
              <Select
                value={period.currMonth}
                onChange={(e) => setCurrMonth(Number(e.target.value))}
                options={currMonths.map((m) => ({ value: m, label: MONTH_KR[m] }))}
                className="flex-1"
              />
            </div>
            
            {/* 기간 배지 */}
            <div className="flex items-center gap-2 mt-3">
              <Badge className="text-[10px]">기준 {period.baseLabel}</Badge>
              <span className="text-foreground-subtle">→</span>
              <Badge variant="info" className="text-[10px]">실적 {period.currLabel}</Badge>
            </div>
          </section>

          {/* 분석 모델 */}
          <section>
            <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
              분석 모델
            </label>
            <RadioGroup
              name="model"
              value={model}
              onChange={(v) => setModel(v as 'A' | 'B')}
              options={[
                { value: 'A', label: '모델 A: 원인별 임팩트' },
                { value: 'B', label: '모델 B: 활동별 증분' },
              ]}
            />
            <p className="mt-1.5 text-[10px] text-foreground-subtle">
              {model === 'A' ? '재무/감사용 표준 모델' : '영업/전략 보고용 모델'}
            </p>
          </section>

          {/* 품목계정 필터 */}
          <section>
            <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
              품목계정 필터
            </label>
            <div className="flex flex-col gap-1.5">
              {(['제품', '상품', '기타'] as AccountType[]).map((type) => (
                <Checkbox
                  key={type}
                  label={type}
                  checked={accountTypes.includes(type)}
                  onChange={() => handleAccountTypeToggle(type)}
                />
              ))}
            </div>
          </section>

          {/* 표시 옵션 */}
          <section>
            <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
              표시 옵션
            </label>
            <Checkbox
              label="환종별 상세 표시"
              checked={showDetail}
              onChange={(e) => setShowDetail(e.target.checked)}
            />
            <p className="mt-1 text-[10px] text-foreground-subtle">
              KRW/USD 분리하여 단가·환율 표시
            </p>
          </section>

          {/* 데이터 요약 */}
          <section className="mt-auto pt-4 border-t border-primary-500/10">
            <div className="text-[10px] text-foreground-subtle space-y-1">
              <p>총 {rawData.length.toLocaleString()}건의 거래 데이터</p>
              <p>{availableYears.length}개 연도 데이터 포함</p>
            </div>
          </section>
        </>
      )}
    </aside>
  );
}
