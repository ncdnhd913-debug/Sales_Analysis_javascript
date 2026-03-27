# 매출 차이 분석 (Sales Variance Analysis)

ERP 매출 데이터 기반 차이 분석 대시보드입니다.  
수량, 단가, 환율 요인별로 매출 변동을 분해하여 시각화합니다.

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 📊 주요 기능

### 분석 모델
- **모델 A (원인별 임팩트)**: 재무/감사 표준 — 수량·단가·환율 효과 상호독립 분해
- **모델 B (활동별 증분)**: 영업/전략 보고 — 유리한 단가 적용, 활동 기여 중심

### 기간 비교
- **YoY (전년 동월 대비)**: 동일 월 기준 전년 대비 분석
- **MoM (전월 대비)**: 직전 월 대비 분석
- **YTD 누적**: 1월~해당 월 누적 비교

### 대시보드 기능
- 📈 KPI 요약 (기준/실적/총차이)
- 📊 요인별 분해 바 (수량/단가/환율 기여도)
- 🤖 AI 분석 제언 (Claude API 연동)
- 📦 커스텀 그룹별 분석
- 🗂️ 품목계정별 분석 (제품/상품/기타)
- 🌊 Waterfall 차트
- 📊 품목별 Bar 차트
- ⬇️ 엑셀 다운로드

## 📁 프로젝트 구조

```
sales-analysis-v2/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui.tsx              # 기본 UI 컴포넌트
│   ├── Sidebar.tsx         # 사이드바 (파일 업로드, 설정)
│   ├── FileUploader.tsx    # 파일 업로드
│   ├── KpiSummary.tsx      # KPI 카드
│   ├── GroupSelector.tsx   # 그룹 선택
│   ├── GroupEditor.tsx     # 그룹 편집
│   ├── DataTable.tsx       # 데이터 테이블
│   ├── WaterfallChart.tsx  # Waterfall 차트
│   ├── ItemBarChart.tsx    # Bar 차트
│   ├── ChartTabs.tsx       # 차트 탭
│   ├── AccountAnalysis.tsx # 품목계정별 분석
│   ├── AIAnalysis.tsx      # AI 분석 제언
│   ├── ModelBanner.tsx     # 모델 배너
│   ├── ModelGuide.tsx      # 모델 비교 가이드
│   └── RawDataViewer.tsx   # 원본 데이터 뷰어
├── lib/
│   ├── types.ts            # 타입 정의
│   ├── constants.ts        # 상수
│   ├── utils.ts            # 유틸리티 함수
│   ├── excel-parser.ts     # 엑셀 파싱
│   └── models.ts           # 분석 모델 (A/B)
├── stores/
│   ├── useDataStore.ts     # 데이터 상태
│   └── useGroupStore.ts    # 그룹 상태
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 📋 엑셀 컬럼 매핑 (0-based index)

| 열 | 인덱스 | 내용 |
|----|--------|------|
| D  | 3      | 매출일 (YYYY-MM-DD) |
| I  | 8      | 매출처명 |
| V  | 21     | 품목코드 |
| W  | 22     | 품목명 |
| AB | 27     | 단위 |
| AD | 29     | 수량 |
| AE | 30     | 환종 (KRW/USD) |
| AF | 31     | 환율 |
| AI | 34     | 외화단가 |
| AJ | 35     | 외화금액 |
| AN | 39     | 원화단가 |
| AO | 40     | 원화금액 |
| BC | 54     | 품목계정 |

## 🔧 분석 모델 수식

### 모델 A (원인별 임팩트)

**KRW**:
- ① 수량차이: `(Q1 - Q0) × P0_krw`
- ② 단가차이: `(P1_krw - P0_krw) × Q1`
- ③ 환율차이: `0`

**USD**:
- ① 수량차이: `(Q1 - Q0) × P0_fx × ER0`
- ② 단가차이: `(P1_fx - P0_fx) × Q1 × ER0`
- ③ 환율차이: `(ER1 - ER0) × Q1 × P1_fx`

### 모델 B (활동별 증분)

**수량차이**:
- Q 증가: `(Q1 - Q0) × P1_krw`
- Q 감소: `(Q1 - Q0) × P0_krw`

**환율차이 (4-Case)**:
- P↑ Q↑: `dER × Q0 × P1_fx`
- P↑ Q↓: `dER × Q1 × P1_fx`
- P↓ Q↑: `dER × Q0 × P0_fx`
- P↓ Q↓: `dER × Q1 × P0_fx`

**단가차이**: `총차이 - ① - ③` (Residual)

## 🚢 Vercel 배포

1. GitHub에 푸시
2. Vercel에서 Import
3. 자동 배포 완료

## 📄 라이선스

MIT License
