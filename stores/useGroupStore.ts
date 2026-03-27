// ==============================================================================
// stores/useGroupStore.ts — 품목 그룹 상태 관리 (localStorage 저장)
// ==============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GroupMapping, Groups } from '@/lib/types';
import { buildGroups } from '@/lib/utils';

interface GroupState {
  // 품목 → 그룹 매핑
  itemMapping: GroupMapping;

  // 선택된 그룹
  selectedGroups: Set<string>;

  // 해제된 그룹 (새 그룹 자동 선택 방지용)
  deselectedGroups: Set<string>;

  // 액션
  setItemGroup: (itemName: string, groupName: string) => void;
  setMultipleItemGroups: (mapping: GroupMapping) => void;
  clearAllGroups: () => void;
  toggleGroup: (groupName: string) => void;
  selectAllGroups: (groups: Groups) => void;
  deselectAllGroups: () => void;
  buildGroups: (allItems: string[]) => Groups;
  syncSelectedGroups: (groups: Groups) => void;
  exportToJson: () => string;
  importFromJson: (json: string) => boolean;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      itemMapping: {},
      selectedGroups: new Set<string>(),
      deselectedGroups: new Set<string>(),

      // 단일 품목 그룹 설정
      setItemGroup: (itemName, groupName) => {
        set((state) => ({
          itemMapping: {
            ...state.itemMapping,
            [itemName]: groupName.trim(),
          },
        }));
      },

      // 여러 품목 그룹 일괄 설정
      setMultipleItemGroups: (mapping) => {
        set((state) => ({
          itemMapping: {
            ...state.itemMapping,
            ...mapping,
          },
        }));
      },

      // 전체 그룹 설정 초기화
      clearAllGroups: () => {
        set({
          itemMapping: {},
          selectedGroups: new Set<string>(),
          deselectedGroups: new Set<string>(),
        });
      },

      // 그룹 토글
      toggleGroup: (groupName) => {
        set((state) => {
          const newSelected = new Set(state.selectedGroups);
          const newDeselected = new Set(state.deselectedGroups);

          if (newSelected.has(groupName)) {
            newSelected.delete(groupName);
            newDeselected.add(groupName);
          } else {
            newSelected.add(groupName);
            newDeselected.delete(groupName);
          }

          return {
            selectedGroups: newSelected,
            deselectedGroups: newDeselected,
          };
        });
      },

      // 전체 선택
      selectAllGroups: (groups) => {
        set({
          selectedGroups: new Set(Object.keys(groups)),
          deselectedGroups: new Set<string>(),
        });
      },

      // 전체 해제
      deselectAllGroups: () => {
        set((state) => ({
          selectedGroups: new Set<string>(),
          deselectedGroups: new Set(Object.keys(state.itemMapping)),
        }));
      },

      // 그룹 구조 생성
      buildGroups: (allItems) => {
        const { itemMapping } = get();
        return buildGroups(itemMapping, allItems);
      },

      // 선택된 그룹 동기화 (새 그룹 자동 선택, 사라진 그룹 정리)
      syncSelectedGroups: (groups) => {
        set((state) => {
          const groupNames = Object.keys(groups);
          const newSelected = new Set<string>();

          for (const gn of groupNames) {
            // 명시적으로 해제하지 않은 그룹은 선택
            if (!state.deselectedGroups.has(gn)) {
              newSelected.add(gn);
            }
          }

          return { selectedGroups: newSelected };
        });
      },

      // JSON 내보내기
      exportToJson: () => {
        const { itemMapping } = get();
        return JSON.stringify(itemMapping, null, 2);
      },

      // JSON 가져오기
      importFromJson: (json) => {
        try {
          const mapping = JSON.parse(json) as GroupMapping;
          if (typeof mapping === 'object' && mapping !== null) {
            set({
              itemMapping: mapping,
              selectedGroups: new Set<string>(),
              deselectedGroups: new Set<string>(),
            });
            return true;
          }
        } catch {
          // ignore
        }
        return false;
      },
    }),
    {
      name: 'sales-analysis-groups',
      // Set을 Array로 변환하여 저장
      partialize: (state) => ({
        itemMapping: state.itemMapping,
        selectedGroups: Array.from(state.selectedGroups),
        deselectedGroups: Array.from(state.deselectedGroups),
      }),
      // Array를 Set으로 복원
      merge: (persisted, current) => {
        const p = persisted as {
          itemMapping?: GroupMapping;
          selectedGroups?: string[];
          deselectedGroups?: string[];
        };
        return {
          ...current,
          itemMapping: p.itemMapping || {},
          selectedGroups: new Set(p.selectedGroups || []),
          deselectedGroups: new Set(p.deselectedGroups || []),
        };
      },
    }
  )
);
