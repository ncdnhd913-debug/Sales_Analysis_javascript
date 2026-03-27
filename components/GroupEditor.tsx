'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { parseGroupMappingExcel, exportGroupMappingToExcel } from '@/lib/excel-parser';
import { Button, Input, Expander } from './ui';
import { cn } from '@/lib/utils';

export function GroupEditor() {
  const { rawData } = useDataStore();
  const { itemMapping, setItemGroup, setMultipleItemGroups, clearAllGroups, exportToJson, importFromJson } = useGroupStore();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // 품목 목록 (품목계정, 품목코드, 품목명)
  const items = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ 품목계정: string; 품목코드: string; 품목명: string }> = [];
    
    for (const row of rawData) {
      if (!seen.has(row.품목명)) {
        seen.add(row.품목명);
        result.push({
          품목계정: row.품목계정,
          품목코드: row.품목코드,
          품목명: row.품목명,
        });
      }
    }
    
    return result.sort((a, b) => {
      if (a.품목계정 !== b.품목계정) return a.품목계정.localeCompare(b.품목계정);
      return a.품목명.localeCompare(b.품목명);
    });
  }, [rawData]);

  // 그룹별 카운트
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const grp of Object.values(itemMapping)) {
      if (grp) {
        counts[grp] = (counts[grp] || 0) + 1;
      }
    }
    return counts;
  }, [itemMapping]);

  const handleStartEdit = (itemName: string) => {
    setEditingItem(itemName);
    setEditValue(itemMapping[itemName] || '');
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      setItemGroup(editingItem, editValue);
      setEditingItem(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValue('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const mapping = await parseGroupMappingExcel(file);
      if (Object.keys(mapping).length > 0) {
        setMultipleItemGroups(mapping);
        alert(`${Object.keys(mapping).length}개 품목의 그룹 설정을 불러왔습니다.`);
      } else {
        alert('파일 형식 오류: 품목명, 커스텀 그룹명 열이 필요합니다.');
      }
    } catch {
      alert('파일 읽기 실패');
    }

    e.target.value = '';
  };

  const handleExportExcel = () => {
    exportGroupMappingToExcel(items, itemMapping);
  };

  const handleExportJson = () => {
    const json = exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '품목그룹설정.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const success = importFromJson(reader.result as string);
      if (success) {
        alert('그룹 설정을 불러왔습니다.');
      } else {
        alert('JSON 형식 오류');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (items.length === 0) return null;

  return (
    <Expander title="📂 품목 그룹 설정 (클릭하여 펼치기 / 접기)">
      <p className="text-xs text-foreground-subtle mb-4">
        커스텀 그룹명 열에 그룹명을 입력하면 같은 이름끼리 묶입니다. 빈칸은 미분류로 처리됩니다.
      </p>

      {/* 가져오기/내보내기 버튼 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <label className="cursor-pointer inline-flex items-center justify-center rounded-lg font-medium transition-all text-xs px-3 py-1.5 bg-primary-500/10 text-primary-200 border border-primary-500/30 hover:bg-primary-500/20">
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          📥 엑셀에서 불러오기
        </label>
        <Button variant="secondary" size="sm" onClick={handleExportExcel}>
          📤 엑셀로 내보내기
        </Button>
        <label className="cursor-pointer inline-flex items-center justify-center rounded-lg font-medium transition-all text-xs px-3 py-1.5 bg-transparent text-foreground-muted hover:bg-primary-500/10 hover:text-primary-200">
          <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          JSON 불러오기
        </label>
        <Button variant="ghost" size="sm" onClick={handleExportJson}>
          JSON 내보내기
        </Button>
        <Button variant="danger" size="sm" onClick={clearAllGroups}>
          전체 초기화
        </Button>
      </div>

      {/* 현재 그룹 배지 */}
      {Object.keys(groupCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(groupCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([grp, cnt]) => (
              <span
                key={grp}
                className="inline-block px-3 py-1 rounded-full bg-primary-600 text-white text-xs font-medium"
              >
                {grp} ({cnt})
              </span>
            ))}
        </div>
      )}

      {/* 품목 테이블 */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border border-primary-500/20">
        <table className="w-full text-sm">
          <thead className="bg-primary-500/5 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-foreground-muted w-24">품목계정</th>
              <th className="px-3 py-2 text-left font-medium text-foreground-muted w-32">품목코드</th>
              <th className="px-3 py-2 text-left font-medium text-foreground-muted">품목명</th>
              <th className="px-3 py-2 text-left font-medium text-foreground-muted w-48">커스텀 그룹명</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.품목명} className="border-t border-primary-500/10 hover:bg-primary-500/5">
                <td className="px-3 py-2 text-foreground-muted">{item.품목계정}</td>
                <td className="px-3 py-2 text-foreground-muted font-mono text-xs">{item.품목코드}</td>
                <td className="px-3 py-2 text-foreground">{item.품목명}</td>
                <td className="px-3 py-2">
                  {editingItem === item.품목명 ? (
                    <div className="flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="flex-1 py-1"
                        autoFocus
                      />
                      <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                        ✓
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(item.품목명)}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded border border-transparent',
                        'hover:border-primary-500/30 hover:bg-primary-500/5 transition-colors',
                        itemMapping[item.품목명]
                          ? 'text-primary-300 font-medium'
                          : 'text-foreground-subtle italic'
                      )}
                    >
                      {itemMapping[item.품목명] || '(미분류 - 클릭하여 편집)'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Expander>
  );
}
