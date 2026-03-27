// ==============================================================================
// lib/utils.ts — 유틸리티 함수
// ==============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SalesRow, GroupMapping, Groups, AccountType } from './types';

// Tailwind 클래스 병합
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 엑셀 날짜 파싱 (숫자 또는 문자열)
export function parseExcelDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  
  if (typeof value === 'number') {
    // 엑셀 시리얼 날짜
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

// 숫자 파싱
export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// 품목계정 분류
export function classifyAccount(account: string): AccountType {
  const v = (account || '').trim();
  if (v === '제품') return '제품';
  if (v === '상품') return '상품';
  return '기타';
}

// 그룹 매핑 → 그룹 구조 변환
export function buildGroups(itemMapping: GroupMapping, allItems: string[]): Groups {
  const groups: Groups = {};
  
  for (const item of allItems) {
    const grp = (itemMapping[item] || '').trim() || '미분류';
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(item);
  }
  
  // 미분류를 마지막으로
  if (groups['미분류']) {
    const unclassified = groups['미분류'];
    delete groups['미분류'];
    groups['미분류'] = unclassified;
  }
  
  return groups;
}

// 그룹 설정 JSON 직렬화
export function groupsToJson(mapping: GroupMapping): string {
  return JSON.stringify(mapping, null, 2);
}

// JSON → 그룹 매핑
export function jsonToGroups(jsonStr: string): GroupMapping {
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as GroupMapping;
    }
  } catch {
    // ignore
  }
  return {};
}

// 파일 다운로드
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 배열 그룹화
export function groupBy<T>(arr: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// 합계 계산
export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

// 가중 평균
export function weightedAverage(values: number[], weights: number[]): number {
  const totalWeight = sum(weights);
  if (totalWeight === 0) return 0;
  return sum(values.map((v, i) => v * weights[i])) / totalWeight;
}

// 연도/월 목록 추출
export function getYears(data: SalesRow[]): number[] {
  const years = new Set(data.map(r => r.연도));
  return Array.from(years).sort((a, b) => b - a);
}

export function getMonths(data: SalesRow[], year: number): number[] {
  const months = new Set(data.filter(r => r.연도 === year).map(r => r.월));
  return Array.from(months).sort((a, b) => a - b);
}

// 품목 목록 추출
export function getItems(data: SalesRow[]): string[] {
  const items = new Set(data.map(r => r.품목명));
  return Array.from(items).sort();
}

// 기간 필터링
export function filterByPeriod(
  data: SalesRow[],
  year: number,
  month: number,
  isYtd: boolean = false
): SalesRow[] {
  if (isYtd) {
    return data.filter(r => r.연도 === year && r.월 <= month);
  }
  return data.filter(r => r.연도 === year && r.월 === month);
}

// 품목계정 필터링
export function filterByAccountType(
  data: SalesRow[],
  accountTypes: AccountType[]
): SalesRow[] {
  if (accountTypes.length === 0) return data;
  return data.filter(r => accountTypes.includes(r.품목계정_분류));
}

// 디바운스
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
