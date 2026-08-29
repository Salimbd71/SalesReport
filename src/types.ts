export interface SalesRecord {
  id: string;
  HQ_CODE: string;
  HQ_NAME: string;
  CUST_CODE: string;
  MHL_CUST_ID: string;
  MHL_CUST_NAME: string;
  THERAPY: string;
  BRAND: string;
  ITEM_CODE: string;
  ITEM_NAME: string;
  ITEM_SER: string;
  SALES_PACK: number | string;
  EXP_QTY_BOX: number;
  EXP_VALUE: number;
  SALES_QTY_BOX: number;
  SALES_VALUE: number;
  FLM: string; // Col P (new in Sheet 4)
  HQ: string;  // Col Q (new in Sheet 4)
  isMatched: boolean;
  rawRowIndex?: number;
}

export interface CustomerSalesRecord {
  id: string;
  HQ_CODE: string;
  HQ_NAME: string;
  CUST_CODE: string;
  MHL_CUST_ID: string;
  MHL_CUST_NAME: string;
  PRODUCT_COUNT: number | string;
  THERAPY?: string;
  EXP_QTY_BOX: number;
  EXP_VALUE: number;
  SALES_QTY_BOX: number;
  SALES_VALUE: number;
  SALES_VALUE_CURRENT?: number;
  SALES_VALUE_LAST?: number;
  deficit?: number;
  isLastMonthOnly?: boolean;
  isCurrentMonthOnly?: boolean;
  FLM: string; // Col K (or Col M in Compare Mode)
  HQ: string;  // Col L (or Col N in Compare Mode)
  isMatched: boolean;
  rawRowIndex?: number;
}

export interface ChemistRecord {
  slNo?: string | number;
  mhlCode?: string;
  custCode: string;
  custName: string;
  address?: string;
  nameOfDepot?: string;
  rsm?: string;
  fsm2526?: string;
  fsmNew2627: string; // Column I (FLM)
  azuraHq2526?: string;
  azuraHqNew2627: string; // Column K (HQ)
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  detail?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  sheetName: string;
  availableSheets: string[];
  detectedColumns: string[];
  missingColumns: string[];
  issues: ValidationIssue[];
  dateHeader?: string;
  rowCount: number;
}

export interface PivotRowData {
  flm: string;
  hq: string;
  brandValues: Record<string, number>;
  rowTotal: number;
  customerCount?: number;
  recordCount?: number;
}

export interface FLMGroupPivot {
  flm: string;
  hqList: PivotRowData[];
  flmSubtotal: Record<string, number>;
  flmTotal: number;
  recordCount: number;
}

export interface PivotTableData {
  brands: string[];
  flmGroups: FLMGroupPivot[];
  columnGrandTotals: Record<string, number>;
  grandTotal: number;
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
}
