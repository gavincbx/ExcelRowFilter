export type ColumnType = 'string' | 'number' | 'date' | 'boolean';

export interface ColumnInfo {
  key: string;
  label: string;
  type: ColumnType;
  distinctValues: { value: string; count: number }[];
  minNumber?: number;
  maxNumber?: number;
  hasEmpty: boolean;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'between'
  | 'is_empty'
  | 'is_not_empty';

export interface FilterRule {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
  valueSecondary?: string; // used for 'between'
  caseSensitive?: boolean;
}

export type MatchMode = 'and' | 'or';

export interface ParsedSheet {
  name: string;
  columns: ColumnInfo[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface ParsedWorkbook {
  fileName: string;
  sheetNames: string[];
  activeSheetName: string;
  sheets: Record<string, ParsedSheet>;
}

export interface FilterResult {
  matchingRows: Record<string, any>[];
  matchingIndices: Set<number>;
  totalRows: number;
  matchCount: number;
  unmatchedCount: number;
  matchPercentage: number;
  activeRulesCount: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  createdAt: number;
  rules: FilterRule[];
  matchMode: MatchMode;
  sheetName?: string;
  isSystem?: boolean;
}

export interface GroupSummaryItem {
  category: string;
  matchedCount: number;
  totalDatasetCount: number;
  percentageOfMatches: number;
}

export interface NumericAggregate {
  column: string;
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}
