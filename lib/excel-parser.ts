// ==============================================================================
// lib/excel-parser.ts — ERP 엑셀 파일 파싱
// ==============================================================================

import * as XLSX from 'xlsx';
import { COL_IDX } from './constants';
import { parseExcelDate, parseNumber, classifyAccount } from './utils';
import type { SalesRow } from './types';

export function parseExcelFile(file: File): Promise<SalesRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 2D 배열로 변환 (헤더 포함)
        const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        });
        
        if (rawData.length < 2) {
          reject(new Error('데이터가 없습니다'));
          return;
        }
        
        // 헤더 제외하고 데이터 행만 처리
        const rows = rawData.slice(1);
        const salesRows: SalesRow[] = [];
        
        for (const row of rows) {
          if (!Array.isArray(row)) continue;
          
          const 매출일 = parseExcelDate(row[COL_IDX.매출일]);
          if (!매출일) continue; // 날짜 없는 행 스킵
          
          const 품목계정 = String(row[COL_IDX.품목계정] || '').trim();
          
          salesRows.push({
            매출일,
            매출처명: String(row[COL_IDX.매출처명] || '').trim(),
            품목코드: String(row[COL_IDX.품목코드] || '').trim(),
            품목명: String(row[COL_IDX.품목명] || '(미분류)').trim(),
            단위: String(row[COL_IDX.단위] || '').trim(),
            수량: parseNumber(row[COL_IDX.수량]),
            환종: String(row[COL_IDX.환종] || 'KRW').trim().toUpperCase(),
            환율: parseNumber(row[COL_IDX.환율]),
            외화단가: parseNumber(row[COL_IDX.외화단가]),
            외화금액: parseNumber(row[COL_IDX.외화금액]),
            원화단가: parseNumber(row[COL_IDX.원화단가]),
            원화금액: parseNumber(row[COL_IDX.원화금액]),
            품목계정,
            품목계정_분류: classifyAccount(품목계정),
            연도: 매출일.getFullYear(),
            월: 매출일.getMonth() + 1,
          });
        }
        
        resolve(salesRows);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
}

// 데이터프레임을 엑셀로 내보내기
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

// 그룹 설정을 엑셀로 내보내기
export function exportGroupMappingToExcel(
  items: Array<{ 품목계정: string; 품목코드: string; 품목명: string }>,
  mapping: Record<string, string>
): void {
  const data = items.map(item => ({
    품목계정: item.품목계정,
    품목코드: item.품목코드,
    품목명: item.품목명,
    '커스텀 그룹명': mapping[item.품목명] || '',
  }));
  
  exportToExcel(data, '품목그룹설정.xlsx', '품목그룹');
}

// 그룹 설정 엑셀 파일 읽기
export function parseGroupMappingExcel(file: File): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
        
        const mapping: Record<string, string> = {};
        for (const row of rows) {
          const itemName = row['품목명']?.trim();
          const groupName = row['커스텀 그룹명']?.trim();
          if (itemName && groupName) {
            mapping[itemName] = groupName;
          }
        }
        
        resolve(mapping);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
}
