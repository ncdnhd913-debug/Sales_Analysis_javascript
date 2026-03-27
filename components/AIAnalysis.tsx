'use client';

import { useState, useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { calculateKpis } from '@/lib/models';
import { formatNumber, formatPercent } from '@/lib/constants';
import { Button, Spinner, SectionHeader } from './ui';

export function AIAnalysis() {
  const { summary, period, model, aiResult, setAiResult } = useDataStore();
  const { selectedGroups, buildGroups } = useGroupStore();
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // KPI 계산
  const kpis = useMemo(() => {
    const allItems = summary.map((r) => r.품목명);
    const groups = buildGroups(allItems);
    const selectedItems = Array.from(selectedGroups).flatMap((gn) => groups[gn] || []);
    if (selectedItems.length === 0) return calculateKpis(summary);
    return calculateKpis(summary, selectedItems);
  }, [summary, selectedGroups, buildGroups]);

  // 파라미터 키 (변경 시 결과 초기화용)
  const paramKey = useMemo(() => {
    const items = Array.from(selectedGroups).sort().slice(0, 15).join(',');
    return `${period.baseLabel}|${period.currLabel}|${period.mode}|${model}|${items}`;
  }, [period, model, selectedGroups]);

  const handleAnalysis = async () => {
    const key = apiKey || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    
    if (!key) {
      setShowKeyInput(true);
      return;
    }

    setAiResult({ status: 'loading', content: '', paramKey });

    const selectedGroupNames = Array.from(selectedGroups).join(', ') || '전체';
    const selectedItemsList = summary.slice(0, 20).map((r) => r.품목명).join(', ');

    const prompt = `당신은 매출 차이 분석 전문 애널리스트입니다. 아래 데이터를 바탕으로 경영진을 위한 간결하고 통찰력 있는 분석 제언을 한국어로 작성하세요.

[분석 파라미터]
- 비교 기간: ${period.baseLabel} vs ${period.currLabel}
- 비교 방식: ${period.mode === 'YoY' ? '전년 동월 대비' : '전월 대비'}${period.isYtd ? ' (YTD 누적)' : ''}
- 분석 모델: 모델 ${model} (${model === 'A' ? '원인별 임팩트 분석' : '활동별 증분 분석'})
- 분석 대상: ${selectedGroupNames}

[분석 수치]
- 기준 매출: ${formatNumber(kpis.totalBase)}원
- 실적 매출: ${formatNumber(kpis.totalCurr)}원
- 총 차이: ${kpis.totalDiff >= 0 ? '+' : ''}${formatNumber(kpis.totalDiff)}원 (${formatPercent(kpis.growthPct)})
- 수량 차이: ${kpis.qtyVariance >= 0 ? '+' : ''}${formatNumber(kpis.qtyVariance)}원 (${formatPercent(kpis.qtyPct)})
- 단가 차이: ${kpis.priceVariance >= 0 ? '+' : ''}${formatNumber(kpis.priceVariance)}원 (${formatPercent(kpis.pricePct)})
- 환율 차이: ${kpis.fxVariance >= 0 ? '+' : ''}${formatNumber(kpis.fxVariance)}원 (${formatPercent(kpis.fxPct)})
- 품목: ${selectedItemsList}

아래 구조로 작성하세요:
**핵심 요약**: 가장 중요한 변화 한 문장
**주요 성과**: 긍정적인 부분 (2문장)
**주의 사항**: 우려되는 부분 (2문장)
**제언**: 구체적 액션 아이템 2개`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      const text = data.content
        ?.filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('') || '분석 결과를 받지 못했습니다.';

      setAiResult({ status: 'success', content: text, paramKey });
    } catch (error) {
      setAiResult({
        status: 'error',
        content: `⚠️ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        paramKey,
      });
    }
  };

  // 파라미터 변경 시 결과 초기화
  if (aiResult.paramKey !== paramKey && aiResult.status !== 'idle') {
    setAiResult({ status: 'idle', content: '', paramKey: '' });
  }

  return (
    <div className="space-y-4">
      <SectionHeader icon="🤖">AI 분석 제언</SectionHeader>

      {showKeyInput && (
        <div className="p-4 rounded-lg bg-primary-500/5 border border-primary-500/20 mb-4">
          <p className="text-sm text-foreground-muted mb-2">
            Anthropic API 키를 입력하세요:
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-background border border-primary-500/20 text-foreground"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowKeyInput(false);
                handleAnalysis();
              }}
              disabled={!apiKey}
            >
              확인
            </Button>
          </div>
          <p className="text-xs text-foreground-subtle mt-2">
            API 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
          </p>
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleAnalysis}
        disabled={aiResult.status === 'loading'}
      >
        {aiResult.status === 'loading' ? (
          <>
            <Spinner className="w-4 h-4 mr-2" />
            AI 분석 중...
          </>
        ) : (
          '✨ AI 분석 시작'
        )}
      </Button>

      {aiResult.status === 'success' && (
        <div className="p-5 rounded-xl bg-primary-500/5 border border-primary-500/20">
          <div
            className="text-sm text-foreground leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: aiResult.content
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary-200">$1</strong>')
                .replace(/\n/g, '<br />'),
            }}
          />
        </div>
      )}

      {aiResult.status === 'error' && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {aiResult.content}
        </div>
      )}

      {aiResult.status === 'idle' && (
        <div className="p-5 rounded-xl border-2 border-dashed border-primary-500/20 text-center">
          <p className="text-foreground-muted text-sm">
            AI 분석 시작 버튼을 눌러 분석 결과를 확인하세요
          </p>
          <p className="text-foreground-subtle text-xs mt-1">
            파라미터(기간/모델/품목)가 변경되면 결과가 초기화됩니다
          </p>
        </div>
      )}
    </div>
  );
}
