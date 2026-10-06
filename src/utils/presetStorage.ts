import { FilterPreset, FilterRule, MatchMode } from '../types';

const STORAGE_KEY = 'rowfilter_saved_presets_v1';

export const HARDCODED_PRESETS: FilterPreset[] = [
  // 1. Primary Full BV Filter as provided by user
  {
    id: 'preset-full-bv',
    name: 'Full BV Filter',
    createdAt: 1700000000000,
    matchMode: 'and',
    sheetName: 'Full BV',
    isSystem: true,
    rules: [
      {
        id: 'r-fbv-channel',
        column: 'Channel',
        operator: 'equals',
        value: 'App',
      },
      {
        id: 'r-fbv-pkg',
        column: 'Sales Package',
        operator: 'equals',
        value: 'sales_kitting_clone',
      },
      {
        id: 'r-fbv-code',
        column: 'Kitting Code',
        operator: 'not_contains',
        value: 'E',
      },
      {
        id: 'r-fbv-name',
        column: 'Kitting Name',
        operator: 'not_contains',
        value: 'INC',
      },
    ],
  },
  // 2. INC Counterpart Filter
  {
    id: 'preset-inc',
    name: 'INC Filter',
    createdAt: 1700000001000,
    matchMode: 'and',
    sheetName: 'INC',
    isSystem: true,
    rules: [
      {
        id: 'r-inc-channel',
        column: 'Channel',
        operator: 'equals',
        value: 'App',
      },
      {
        id: 'r-inc-pkg',
        column: 'Sales Package',
        operator: 'equals',
        value: 'sales_kitting_clone',
      },
      {
        id: 'r-inc-code',
        column: 'Kitting Code',
        operator: 'not_contains',
        value: 'E',
      },
      {
        id: 'r-inc-name',
        column: 'Kitting Name',
        operator: 'contains',
        value: 'INC',
      },
    ],
  },
  // 3. Additional helpful presets for this schema
  {
    id: 'preset-app-channel-only',
    name: 'App Channel Only',
    createdAt: 1700000002000,
    matchMode: 'and',
    isSystem: true,
    rules: [
      {
        id: 'r-app-only',
        column: 'Channel',
        operator: 'equals',
        value: 'App',
      },
    ],
  },
  {
    id: 'preset-sales-kitting-clone',
    name: 'Sales Kitting Clone Package',
    createdAt: 1700000003000,
    matchMode: 'and',
    isSystem: true,
    rules: [
      {
        id: 'r-pkg-clone',
        column: 'Sales Package',
        operator: 'equals',
        value: 'sales_kitting_clone',
      },
    ],
  },
];

export function getSavedPresets(): FilterPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return HARDCODED_PRESETS;
    }
    const userPresets: FilterPreset[] = JSON.parse(raw);
    const customIds = new Set(userPresets.map((p) => p.id));
    const merged = [
      ...userPresets,
      ...HARDCODED_PRESETS.filter((p) => !customIds.has(p.id)),
    ];
    return merged;
  } catch (err) {
    console.error('Failed to load presets from localStorage', err);
    return HARDCODED_PRESETS;
  }
}

export function saveUserPreset(preset: Omit<FilterPreset, 'id' | 'createdAt'>): FilterPreset {
  const newPreset: FilterPreset = {
    ...preset,
    id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: Date.now(),
    isSystem: false,
  };

  try {
    const current = getSavedPresets().filter((p) => !p.isSystem);
    const updated = [newPreset, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save preset to localStorage', err);
  }

  return newPreset;
}

export function deleteUserPreset(presetId: string): void {
  try {
    const current = getSavedPresets().filter((p) => !p.isSystem && p.id !== presetId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to delete preset from localStorage', err);
  }
}

export function isPresetApplicable(preset: FilterPreset, availableColumnKeys: string[]): boolean {
  if (preset.rules.length === 0) return false;
  const colSet = new Set(availableColumnKeys);
  return preset.rules.every((r) => colSet.has(r.column));
}
