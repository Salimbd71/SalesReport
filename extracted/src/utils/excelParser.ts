import * as XLSX from 'xlsx';
import {
  ChemistRecord,
  CustomerSalesRecord,
  FileValidationResult,
  SalesRecord,
  ValidationIssue,
} from '../types';

// Expected column lists
export const EXPECTED_SALES_COLUMNS = [
  'HQ_CODE',
  'HQ_NAME',
  'CUST_CODE',
  'MHL_CUST_ID',
  'MHL_CUST_NAME',
  'THERAPY',
  'BRAND',
  'ITEM_CODE',
  'ITEM_NAME',
  'ITEM_SER',
  'SALES_PACK',
  'EXP_QTY_BOX',
  'EXP_VALUE',
  'SALES_QTY_BOX',
  'SALES_VALUE',
];

export const EXPECTED_CUSTOMER_SALES_COLUMNS = [
  'HQ_CODE',
  'HQ_NAME',
  'CUST_CODE',
  'MHL_CUST_ID',
  'MHL_CUST_NAME',
  'THERAPY',
  'EXP_QTY_BOX',
  'EXP_VALUE',
  'SALES_QTY_BOX',
  'SALES_VALUE',
];

export const EXPECTED_CHEMIST_COLUMNS = [
  'Cust code',
  'FSM-(NEW)2026-27',
  'AZURA HQ ( New Design)-2026-27',
];

export function normalizeHeader(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toUpperCase()
    .replace(/[\r\n\t_ -]+/g, '');
}

/**
 * Standardize and clean key string (removes non-breaking spaces, trailing .0, trims)
 */
export function cleanKey(val: any): string {
  if (val === undefined || val === null) return '';
  let str = String(val).replace(/\u00A0/g, ' ').trim();
  // Strip trailing .0 from excel numeric conversions
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  return str;
}

/**
 * Standardize FLM / Manager names to avoid slight whitespace splitting
 * e.g. "FSM-DHANMONDI", "FSM - DHANMONDI", "FSM- DHANMONDI" -> "FSM-DHANMONDI"
 */
export function normalizeFlmName(flm: string | undefined | null): string {
  if (!flm) return 'Unassigned FLM';
  let clean = cleanKey(flm);
  if (!clean || clean.toUpperCase() === 'UNDEFINED' || clean.toUpperCase() === 'NULL') {
    return 'Unassigned FLM';
  }
  clean = clean.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim().toUpperCase();
  return clean;
}

/**
 * Standardize HQ names
 */
export function normalizeHqName(hq: string | undefined | null): string {
  if (!hq) return 'Unassigned HQ';
  let clean = cleanKey(hq);
  if (!clean || clean.toUpperCase() === 'UNDEFINED' || clean.toUpperCase() === 'NULL') {
    return 'Unassigned HQ';
  }
  clean = clean.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim().toUpperCase();
  return clean;
}

/**
 * Helper to parse a Sheet 2 (HQ-Customer Sales) from workbook
 */
export function parseCustomerSalesSheetFromWorkbook(
  workbook: XLSX.WorkBook,
  customSheetName?: string
): {
  records: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[];
  sheetName: string;
} {
  const sheetNames = workbook.SheetNames;
  let targetSheetName = customSheetName;

  if (!targetSheetName) {
    // Look for Sheet 2 (index 1) or sheet matching "HQ-Customer Sales"
    const namedSheet = sheetNames.find(
      (s) =>
        (s.toLowerCase().includes('hq-customer') && !s.toLowerCase().includes('product')) ||
        s.toLowerCase().includes('customer sales') ||
        s.toLowerCase() === 'sheet2'
    );
    if (namedSheet) {
      targetSheetName = namedSheet;
    } else if (sheetNames.length >= 2) {
      targetSheetName = sheetNames[1]; // Sheet 2 (index 1)
    } else {
      targetSheetName = sheetNames[0];
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    return { records: [], sheetName: targetSheetName };
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  if (rawRows.length === 0) {
    return { records: [], sheetName: targetSheetName };
  }

  // Find header row (usually row 1 or 2)
  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const matchCount = EXPECTED_CUSTOMER_SALES_COLUMNS.filter((exp) =>
      normalizedRow.includes(normalizeHeader(exp))
    ).length;

    if (matchCount >= 3) {
      headerRowIndex = r;
      detectedHeaders = row.map((cell: any) => cleanKey(cell));
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = rawRows.length > 1 ? 1 : 0;
    detectedHeaders = (rawRows[headerRowIndex] || []).map((c: any) => cleanKey(c));
  }

  const colMap = new Map<string, number>();
  detectedHeaders.forEach((colName, idx) => {
    if (colName) {
      const norm = normalizeHeader(colName);
      colMap.set(norm, idx);

      if (
        norm === 'SALESVALUE' ||
        norm === 'SALES_VALUE' ||
        norm === 'SALESVAL' ||
        norm === 'TOTALSALES' ||
        (norm.includes('SALES') && norm.includes('VAL'))
      ) {
        colMap.set('SALES_VALUE', idx);
      }
      if (
        norm === 'CUSTCODE' ||
        norm === 'CUSTOMERCODE' ||
        norm === 'CUST_CODE' ||
        norm === 'CUSTOMER_CODE' ||
        norm === 'CUSTID'
      ) {
        colMap.set('CUST_CODE', idx);
      }
      if (norm === 'HQCODE' || norm === 'HQ_CODE') {
        colMap.set('HQ_CODE', idx);
      }
      if (norm === 'HQNAME' || norm === 'HQ_NAME' || norm === 'HQ') {
        colMap.set('HQ_NAME', idx);
      }
      if (norm === 'MHLCUSTID' || norm === 'MHL_CUST_ID' || norm === 'MHLCODE') {
        colMap.set('MHL_CUST_ID', idx);
      }
      if (norm === 'MHLCUSTNAME' || norm === 'MHL_CUST_NAME') {
        colMap.set('MHL_CUST_NAME', idx);
      }
    }
  });

  // Explicit positional fallbacks for Sheet 2:
  // Col A: HQ_CODE (0)
  // Col B: HQ_NAME (1)
  // Col C: CUST_CODE (2)
  // Col D: MHL_CUST_ID (3)
  // Col E: MHL_CUST_NAME (4)
  // Col F: THERAPY (5)
  // Col G: EXP_QTY_BOX (6)
  // Col H: EXP_VALUE (7)
  // Col I: SALES_QTY_BOX (8)
  // Col J: SALES_VALUE (9)
  // (Col K and L will be added as K2: FLM, L2: HQ)
  if (!colMap.has('CUST_CODE') && detectedHeaders.length > 2) {
    colMap.set('CUST_CODE', 2);
  }
  if (!colMap.has('SALES_VALUE') && detectedHeaders.length > 9) {
    colMap.set('SALES_VALUE', 9);
  }

  const getColVal = (row: any[], colName: string, defaultVal: any = '') => {
    const idx = colMap.get(normalizeHeader(colName));
    if (idx !== undefined && idx < row.length) {
      const val = row[idx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    const positionalFallback: Record<string, number> = {
      HQ_CODE: 0,
      HQ_NAME: 1,
      CUST_CODE: 2,
      MHL_CUST_ID: 3,
      MHL_CUST_NAME: 4,
      THERAPY: 5,
      EXP_QTY_BOX: 6,
      EXP_VALUE: 7,
      SALES_QTY_BOX: 8,
      SALES_VALUE: 9,
    };
    const fallbackIdx = positionalFallback[colName];
    if (fallbackIdx !== undefined && fallbackIdx < row.length) {
      const val = row[fallbackIdx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    return defaultVal;
  };

  const getNumVal = (row: any[], colName: string): number => {
    const val = getColVal(row, colName, 0);
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const records: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const custCode = cleanKey(getColVal(row, 'CUST_CODE'));
    const hqCode = cleanKey(getColVal(row, 'HQ_CODE'));
    const salesVal = getNumVal(row, 'SALES_VALUE');

    if (!custCode && !hqCode && salesVal === 0) continue;

    records.push({
      id: `cust_sales_${r}_${custCode}`,
      HQ_CODE: hqCode,
      HQ_NAME: cleanKey(getColVal(row, 'HQ_NAME')),
      CUST_CODE: custCode,
      MHL_CUST_ID: cleanKey(getColVal(row, 'MHL_CUST_ID')),
      MHL_CUST_NAME: cleanKey(getColVal(row, 'MHL_CUST_NAME')),
      THERAPY: cleanKey(getColVal(row, 'THERAPY')),
      EXP_QTY_BOX: getNumVal(row, 'EXP_QTY_BOX'),
      EXP_VALUE: getNumVal(row, 'EXP_VALUE'),
      SALES_QTY_BOX: getNumVal(row, 'SALES_QTY_BOX'),
      SALES_VALUE: salesVal,
      rawRowIndex: r + 1,
    });
  }

  return { records, sheetName: targetSheetName };
}

/**
 * Parses Sales Excel file
 * Defaults to Sheet 4 (index 3) for HQ-Customer-Product Sales
 * Also automatically parses Sheet 2 (HQ-Customer Sales)
 */
export async function parseSalesFile(
  file: File | ArrayBuffer,
  selectedSheetName?: string
): Promise<{
  records: Omit<SalesRecord, 'FLM' | 'HQ' | 'isMatched'>[];
  customerRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[];
  customerSheetName: string;
  dateHeader: string;
  validation: FileValidationResult;
  workbook: XLSX.WorkBook;
}> {
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });
  const sheetNames = workbook.SheetNames;

  // Rule: Sheet 4 (index 3) is strictly default when >= 4 sheets exist
  let targetSheetName = selectedSheetName;
  if (!targetSheetName) {
    if (sheetNames.length >= 4) {
      targetSheetName = sheetNames[3]; // Sheet 4 default!
    } else {
      const namedSheet = sheetNames.find(
        (s) =>
          s.toLowerCase().includes('hq-customer-product') ||
          s.toLowerCase().includes('sales') ||
          s.toLowerCase().includes('hq')
      );
      targetSheetName = namedSheet || sheetNames[0];
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const issues: ValidationIssue[] = [];

  // Also parse Sheet 2 (HQ-Customer Sales) from the workbook
  const { records: customerRecords, sheetName: customerSheetName } =
    parseCustomerSalesSheetFromWorkbook(workbook);

  if (!worksheet) {
    return {
      records: [],
      customerRecords: [],
      customerSheetName,
      dateHeader: '',
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_SALES_COLUMNS,
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" not found.` }],
        rowCount: 0,
      },
    };
  }

  // Extract cell A1 text for the date header
  const cellA1 = worksheet['A1'];
  let dateHeader = '';
  if (cellA1) {
    if (cellA1.w) {
      dateHeader = String(cellA1.w).trim();
    } else if (cellA1.v !== undefined && cellA1.v !== null) {
      if (cellA1.v instanceof Date) {
        dateHeader = cellA1.v.toLocaleDateString();
      } else {
        dateHeader = String(cellA1.v).trim();
      }
    }
  }

  // Read raw 2D array of rows with raw values
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  // Find header row (usually row 2 / index 1, or row 1 / index 0)
  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const matchCount = EXPECTED_SALES_COLUMNS.filter((exp) =>
      normalizedRow.includes(normalizeHeader(exp))
    ).length;

    // If at least 3 expected columns match, this is the header row
    if (matchCount >= 3) {
      headerRowIndex = r;
      detectedHeaders = row.map((cell: any) => cleanKey(cell));
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback: row 1 (index 1) if available, otherwise row 0
    headerRowIndex = rawRows.length > 1 ? 1 : 0;
    detectedHeaders = (rawRows[headerRowIndex] || []).map((c: any) => cleanKey(c));
    issues.push({
      type: 'warning',
      message: 'Defaulting to header row ' + (headerRowIndex + 1),
    });
  }

  // Map column index to column name with exact priority matching
  const colMap = new Map<string, number>();
  detectedHeaders.forEach((colName, idx) => {
    if (colName) {
      const norm = normalizeHeader(colName);
      colMap.set(norm, idx);

      if (norm === 'BRAND' || (norm.includes('BRAND') && !norm.includes('NAME'))) {
        colMap.set('BRAND', idx);
      }
      if (
        norm === 'SALESVALUE' ||
        norm === 'SALES_VALUE' ||
        norm === 'SALESVAL' ||
        norm === 'TOTALSALES' ||
        (norm.includes('SALES') && norm.includes('VAL'))
      ) {
        colMap.set('SALES_VALUE', idx);
      }
      if (
        norm === 'CUSTCODE' ||
        norm === 'CUSTOMERCODE' ||
        norm === 'CUST_CODE' ||
        norm === 'CUSTOMER_CODE' ||
        norm === 'CUSTID'
      ) {
        colMap.set('CUST_CODE', idx);
      }
      if (norm === 'HQCODE' || norm === 'HQ_CODE') {
        colMap.set('HQ_CODE', idx);
      }
      if (norm === 'HQNAME' || norm === 'HQ_NAME' || norm === 'HQ') {
        colMap.set('HQ_NAME', idx);
      }
      if (norm === 'MHLCUSTID' || norm === 'MHL_CUST_ID' || norm === 'MHLCODE' || norm === 'MHL_CODE') {
        colMap.set('MHL_CUST_ID', idx);
      }
      if (norm === 'MHLCUSTNAME' || norm === 'MHL_CUST_NAME') {
        colMap.set('MHL_CUST_NAME', idx);
      }
    }
  });

  // Explicit fallback for Column G (index 6) as BRAND: "Sales data file er G2 number column a brand ase"
  if (!colMap.has('BRAND') && detectedHeaders.length > 6) {
    colMap.set('BRAND', 6); // Column G
  }
  // Explicit fallback for Column O (index 14) as SALES_VALUE
  if (!colMap.has('SALES_VALUE') && detectedHeaders.length > 14) {
    colMap.set('SALES_VALUE', 14); // Column O
  }
  // Explicit fallback for Column C (index 2) as CUST_CODE
  if (!colMap.has('CUST_CODE') && detectedHeaders.length > 2) {
    colMap.set('CUST_CODE', 2); // Column C
  }

  // Check missing columns
  const missingCols: string[] = [];
  EXPECTED_SALES_COLUMNS.forEach((exp) => {
    if (!colMap.has(normalizeHeader(exp))) {
      missingCols.push(exp);
    }
  });

  // Helper to extract values
  const getColVal = (row: any[], colName: string, defaultVal: any = '') => {
    const idx = colMap.get(normalizeHeader(colName));
    if (idx !== undefined && idx < row.length) {
      const val = row[idx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    // Positional fallback
    const positionalFallback: Record<string, number> = {
      HQ_CODE: 0,
      HQ_NAME: 1,
      CUST_CODE: 2,
      MHL_CUST_ID: 3,
      MHL_CUST_NAME: 4,
      THERAPY: 5,
      BRAND: 6, // Col G
      ITEM_CODE: 7,
      ITEM_NAME: 8,
      ITEM_SER: 9,
      SALES_PACK: 10,
      EXP_QTY_BOX: 11,
      EXP_VALUE: 12,
      SALES_QTY_BOX: 13,
      SALES_VALUE: 14,
    };
    const fallbackIdx = positionalFallback[colName];
    if (fallbackIdx !== undefined && fallbackIdx < row.length) {
      const val = row[fallbackIdx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    return defaultVal;
  };

  const getNumVal = (row: any[], colName: string): number => {
    const val = getColVal(row, colName, 0);
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Extract records
  const records: Omit<SalesRecord, 'FLM' | 'HQ' | 'isMatched'>[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const custCode = cleanKey(getColVal(row, 'CUST_CODE'));
    const hqCode = cleanKey(getColVal(row, 'HQ_CODE'));
    const brand = cleanKey(getColVal(row, 'BRAND')) || 'OTHER';
    const salesVal = getNumVal(row, 'SALES_VALUE');

    // Only skip if completely blank across all fields
    if (!custCode && !hqCode && brand === 'OTHER' && salesVal === 0) continue;

    records.push({
      id: `sales_${r}_${custCode}`,
      HQ_CODE: hqCode,
      HQ_NAME: cleanKey(getColVal(row, 'HQ_NAME')),
      CUST_CODE: custCode,
      MHL_CUST_ID: cleanKey(getColVal(row, 'MHL_CUST_ID')),
      MHL_CUST_NAME: cleanKey(getColVal(row, 'MHL_CUST_NAME')),
      THERAPY: cleanKey(getColVal(row, 'THERAPY')),
      BRAND: brand,
      ITEM_CODE: cleanKey(getColVal(row, 'ITEM_CODE')),
      ITEM_NAME: cleanKey(getColVal(row, 'ITEM_NAME')),
      ITEM_SER: cleanKey(getColVal(row, 'ITEM_SER')),
      SALES_PACK: getColVal(row, 'SALES_PACK'),
      EXP_QTY_BOX: getNumVal(row, 'EXP_QTY_BOX'),
      EXP_VALUE: getNumVal(row, 'EXP_VALUE'),
      SALES_QTY_BOX: getNumVal(row, 'SALES_QTY_BOX'),
      SALES_VALUE: salesVal,
      rawRowIndex: r + 1,
    });
  }

  const isValid = records.length > 0;

  return {
    records,
    customerRecords,
    customerSheetName,
    dateHeader,
    workbook,
    validation: {
      isValid,
      sheetName: targetSheetName,
      availableSheets: sheetNames,
      detectedColumns: detectedHeaders.filter(Boolean),
      missingColumns: missingCols,
      issues,
      dateHeader,
      rowCount: records.length,
    },
  };
}

/**
 * Parses Chemist Excel file (Sheet DHK-MYN-KH)
 */
export async function parseChemistFile(
  file: File | ArrayBuffer,
  selectedSheetName?: string
): Promise<{
  chemistMap: Map<string, ChemistRecord>;
  chemistList: ChemistRecord[];
  validation: FileValidationResult;
  workbook: XLSX.WorkBook;
}> {
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });
  const sheetNames = workbook.SheetNames;

  // Rule: Sheet Name- DHK-MYN-KH
  let targetSheetName = selectedSheetName;
  if (!targetSheetName) {
    const namedSheet = sheetNames.find(
      (s) =>
        s.toLowerCase().includes('dhk-myn-kh') ||
        s.toLowerCase().includes('dhk') ||
        s.toLowerCase().includes('chemist')
    );
    targetSheetName = namedSheet || sheetNames[0];
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const issues: ValidationIssue[] = [];

  if (!worksheet) {
    return {
      chemistMap: new Map(),
      chemistList: [],
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_CHEMIST_COLUMNS,
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" not found.` }],
        rowCount: 0,
      },
    };
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  // Find header row
  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const hasCust = normalizedRow.some(
      (h) => h.includes('CUSTCODE') || h.includes('CUST') || h.includes('MHLCODE')
    );
    const hasFsmOrHq = normalizedRow.some(
      (h) => h.includes('FSM') || h.includes('FLM') || h.includes('AZURA') || h.includes('HQ')
    );

    if (hasCust && (hasFsmOrHq || row.length >= 8)) {
      headerRowIndex = r;
      detectedHeaders = row.map((cell: any) => cleanKey(cell));
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    detectedHeaders = (rawRows[0] || []).map((c: any) => cleanKey(c));
  }

  let custCodeIdx = -1;
  let flmIdx = -1;
  let hqIdx = -1;
  let custNameIdx = -1;
  let mhlCodeIdx = -1;

  detectedHeaders.forEach((h, idx) => {
    const norm = normalizeHeader(h);
    if (
      norm === 'CUSTCODE' ||
      norm === 'CUSTOMERCODE' ||
      norm === 'CUST_CODE' ||
      norm === 'CUST' ||
      norm.includes('CUSTCODE')
    ) {
      custCodeIdx = idx;
    } else if (norm.includes('CUSTNAME') || norm.includes('CUSTOMERNAME') || norm.includes('CHEMISTNAME')) {
      custNameIdx = idx;
    } else if (norm.includes('MHLCODE') || norm.includes('MHL_CODE') || norm === 'MHL') {
      mhlCodeIdx = idx;
    } else if (
      norm.includes('FSM(NEW)202627') ||
      norm.includes('FSMNEW') ||
      norm.includes('FSM202627') ||
      norm.includes('FSM') ||
      norm.includes('FLM')
    ) {
      flmIdx = idx;
    } else if (
      norm.includes('AZURAHQ(NEWDESIGN)202627') ||
      norm.includes('AZURAHQNEW') ||
      norm.includes('AZURA202627') ||
      norm.includes('AZURAHQ') ||
      norm.includes('HQDESIGN') ||
      norm.includes('NEWDESIGN')
    ) {
      hqIdx = idx;
    }
  });

  // Positional fallback according to specifications:
  // FLM: Col I (index 8)
  // HQ: Col K (index 10)
  if (custCodeIdx === -1) {
    detectedHeaders.forEach((h, idx) => {
      if (normalizeHeader(h).includes('CUST')) custCodeIdx = idx;
    });
    if (custCodeIdx === -1 && detectedHeaders.length > 2) custCodeIdx = 2; // Col C
  }

  if (flmIdx === -1) {
    detectedHeaders.forEach((h, idx) => {
      if (normalizeHeader(h).includes('FSM') || normalizeHeader(h).includes('FLM')) flmIdx = idx;
    });
    if (flmIdx === -1 && detectedHeaders.length > 8) flmIdx = 8; // Col I
  }

  if (hqIdx === -1) {
    detectedHeaders.forEach((h, idx) => {
      if (normalizeHeader(h).includes('AZURA') || normalizeHeader(h).includes('HQ')) hqIdx = idx;
    });
    if (hqIdx === -1 && detectedHeaders.length > 10) hqIdx = 10; // Col K
  }

  const chemistMap = new Map<string, ChemistRecord>();
  const chemistList: ChemistRecord[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawCustCode = custCodeIdx !== -1 && custCodeIdx < row.length ? row[custCodeIdx] : '';
    const custCode = cleanKey(rawCustCode);

    if (!custCode) continue;

    const rawFlmVal = flmIdx !== -1 && flmIdx < row.length ? cleanKey(row[flmIdx]) : '';
    const rawHqVal = hqIdx !== -1 && hqIdx < row.length ? cleanKey(row[hqIdx]) : '';
    const custName = custNameIdx !== -1 && custNameIdx < row.length ? cleanKey(row[custNameIdx]) : '';
    const mhlCode = mhlCodeIdx !== -1 && mhlCodeIdx < row.length ? cleanKey(row[mhlCodeIdx]) : '';

    const normalizedFlm = normalizeFlmName(rawFlmVal);
    const normalizedHq = normalizeHqName(rawHqVal);

    const record: ChemistRecord = {
      custCode,
      custName: custName || `Customer ${custCode}`,
      mhlCode,
      fsmNew2627: normalizedFlm,
      azuraHqNew2627: normalizedHq,
      slNo: row[0],
    };

    // Store multiple key aliases for robust matching
    const keysToAdd = new Set<string>();
    keysToAdd.add(custCode);
    keysToAdd.add(custCode.toUpperCase());
    keysToAdd.add(custCode.toLowerCase());
    keysToAdd.add(custCode.replace(/^0+/, '')); // strip leading 0s
    if (!isNaN(Number(custCode)) && custCode.length > 0) {
      keysToAdd.add(String(Number(custCode)));
      keysToAdd.add(custCode.padStart(5, '0'));
      keysToAdd.add(custCode.padStart(6, '0'));
      keysToAdd.add(custCode.padStart(7, '0'));
    }
    if (mhlCode) {
      keysToAdd.add(mhlCode);
      keysToAdd.add(mhlCode.toUpperCase());
      keysToAdd.add(mhlCode.replace(/^0+/, ''));
    }

    keysToAdd.forEach((k) => {
      if (k && !chemistMap.has(k)) {
        chemistMap.set(k, record);
      }
    });

    chemistList.push(record);
  }

  const isValid = chemistList.length > 0;

  return {
    chemistMap,
    chemistList,
    workbook,
    validation: {
      isValid,
      sheetName: targetSheetName,
      availableSheets: sheetNames,
      detectedColumns: detectedHeaders.filter(Boolean),
      missingColumns: [],
      issues,
      rowCount: chemistList.length,
    },
  };
}

/**
 * Builds HQ to FLM lookup table
 */
function buildHqToFlmLookup(chemistMap: Map<string, ChemistRecord>): Map<string, string> {
  const hqToFlmMap = new Map<string, string>();
  chemistMap.forEach((chemist) => {
    if (chemist.azuraHqNew2627 && chemist.fsmNew2627 && chemist.fsmNew2627 !== 'Unassigned FLM') {
      const hqNorm = normalizeHeader(chemist.azuraHqNew2627);
      if (hqNorm && !hqToFlmMap.has(hqNorm)) {
        hqToFlmMap.set(hqNorm, chemist.fsmNew2627);
      }
    }
  });
  return hqToFlmMap;
}

/**
 * Performs VLOOKUP / mapping between Sheet 4 Sales Records and Chemist Records
 * Sets Column P (FLM) and Column Q (HQ)
 */
export function enrichSalesWithChemist(
  salesRecords: Omit<SalesRecord, 'FLM' | 'HQ' | 'isMatched'>[],
  chemistMap: Map<string, ChemistRecord>
): {
  enrichedRecords: SalesRecord[];
  matchedCount: number;
  unmatchedCount: number;
  unmatchedCodes: string[];
} {
  let matchedCount = 0;
  let unmatchedCount = 0;
  const unmatchedSet = new Set<string>();
  const hqToFlmMap = buildHqToFlmLookup(chemistMap);

  const enrichedRecords: SalesRecord[] = salesRecords.map((rec) => {
    const code = cleanKey(rec.CUST_CODE);
    const mhlCode = cleanKey(rec.MHL_CUST_ID);

    // Multi-tier lookup
    let chemist =
      chemistMap.get(code) ||
      chemistMap.get(code.toUpperCase()) ||
      chemistMap.get(code.replace(/^0+/, '')) ||
      (mhlCode ? chemistMap.get(mhlCode) || chemistMap.get(mhlCode.toUpperCase()) : undefined);

    if (chemist) {
      matchedCount++;
      return {
        ...rec,
        FLM: chemist.fsmNew2627 || 'Unassigned FLM',
        HQ: chemist.azuraHqNew2627 || normalizeHqName(rec.HQ_NAME) || 'Unassigned HQ',
        isMatched: true,
      };
    }

    // Secondary fallback: Infer FLM from HQ_NAME if available
    const salesHqNorm = normalizeHeader(rec.HQ_NAME);
    const inferredFlm = salesHqNorm ? hqToFlmMap.get(salesHqNorm) : undefined;

    if (inferredFlm) {
      matchedCount++;
      return {
        ...rec,
        FLM: inferredFlm,
        HQ: normalizeHqName(rec.HQ_NAME) || 'Unassigned HQ',
        isMatched: true,
      };
    }

    unmatchedCount++;
    if (code) unmatchedSet.add(code);
    return {
      ...rec,
      FLM: 'Unassigned FLM',
      HQ: normalizeHqName(rec.HQ_NAME) || 'Unassigned HQ',
      isMatched: false,
    };
  });

  return {
    enrichedRecords,
    matchedCount,
    unmatchedCount,
    unmatchedCodes: Array.from(unmatchedSet),
  };
}

/**
 * Performs VLOOKUP / mapping for Sheet 2: HQ-Customer Sales Records
 * Sets Column K (FLM) and Column L (HQ)
 */
export function enrichCustomerSalesWithChemist(
  customerRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[],
  chemistMap: Map<string, ChemistRecord>
): {
  enrichedCustomerRecords: CustomerSalesRecord[];
  matchedCount: number;
  unmatchedCount: number;
} {
  let matchedCount = 0;
  let unmatchedCount = 0;
  const hqToFlmMap = buildHqToFlmLookup(chemistMap);

  const enrichedCustomerRecords: CustomerSalesRecord[] = customerRecords.map((rec) => {
    const code = cleanKey(rec.CUST_CODE);
    const mhlCode = cleanKey(rec.MHL_CUST_ID);

    let chemist =
      chemistMap.get(code) ||
      chemistMap.get(code.toUpperCase()) ||
      chemistMap.get(code.replace(/^0+/, '')) ||
      (mhlCode ? chemistMap.get(mhlCode) || chemistMap.get(mhlCode.toUpperCase()) : undefined);

    if (chemist) {
      matchedCount++;
      return {
        ...rec,
        FLM: chemist.fsmNew2627 || 'Unassigned FLM',
        HQ: chemist.azuraHqNew2627 || normalizeHqName(rec.HQ_NAME) || 'Unassigned HQ',
        isMatched: true,
      };
    }

    const salesHqNorm = normalizeHeader(rec.HQ_NAME);
    const inferredFlm = salesHqNorm ? hqToFlmMap.get(salesHqNorm) : undefined;

    if (inferredFlm) {
      matchedCount++;
      return {
        ...rec,
        FLM: inferredFlm,
        HQ: normalizeHqName(rec.HQ_NAME) || 'Unassigned HQ',
        isMatched: true,
      };
    }

    unmatchedCount++;
    return {
      ...rec,
      FLM: 'Unassigned FLM',
      HQ: normalizeHqName(rec.HQ_NAME) || 'Unassigned HQ',
      isMatched: false,
    };
  });

  return {
    enrichedCustomerRecords,
    matchedCount,
    unmatchedCount,
  };
}
