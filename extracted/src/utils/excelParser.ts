import * as XLSX from 'xlsx';
import {
  ChemistRecord,
  CustomerSalesRecord,
  FileValidationResult,
  RawSalesRecord,
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

// Sheet 2: HQ-Customer Sales format (10 columns as requested)
export const EXPECTED_CUSTOMER_SALES_COLUMNS = [
  'HQ_CODE',
  'HQ_NAME',
  'CUST_CODE',
  'MHL_CUST_ID',
  'MHL_CUST_NAME',
  'PRODUCT_COUNT',
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

const MONTH_NAMES_MAP: Record<string, string> = {
  '01': 'JAN', '1': 'JAN', 'JAN': 'JAN', 'JANUARY': 'JAN',
  '02': 'FEB', '2': 'FEB', 'FEB': 'FEB', 'FEBRUARY': 'FEB',
  '03': 'MAR', '3': 'MAR', 'MAR': 'MAR', 'MARCH': 'MAR',
  '04': 'APR', '4': 'APR', 'APR': 'APR', 'APRIL': 'APR',
  '05': 'MAY', '5': 'MAY', 'MAY': 'MAY',
  '06': 'JUN', '6': 'JUN', 'JUN': 'JUN', 'JUNE': 'JUN',
  '07': 'JUL', '7': 'JUL', 'JUL': 'JUL', 'JULY': 'JUL',
  '08': 'AUG', '8': 'AUG', 'AUG': 'AUG', 'AUGUST': 'AUG',
  '09': 'SEP', '9': 'SEP', 'SEP': 'SEP', 'SEPTEMBER': 'SEP',
  '10': 'OCT', 'OCT': 'OCT', 'OCTOBER': 'OCT',
  '11': 'NOV', 'NOV': 'NOV', 'NOVEMBER': 'NOV',
  '12': 'DEC', 'DEC': 'DEC', 'DECEMBER': 'DEC',
};

/**
 * Robust detection of Sales Value column header.
 * Matches standard names, dynamic date ranges (e.g. SALES-UPTO-5-AUG, SALES-UPTO-5-SEP),
 * date range strings in headers, or synonyms.
 */
export function isSalesValueColumn(rawHeader: string): boolean {
  if (!rawHeader) return false;
  const norm = normalizeHeader(rawHeader);
  if (!norm) return false;

  // Exclude non-sales numeric columns
  if (
    norm.includes('QTY') ||
    norm.includes('QUANTITY') ||
    norm.includes('PACK') ||
    norm.includes('TARGET') ||
    norm.includes('SERIAL') ||
    norm === 'SL' ||
    norm === 'SLNO' ||
    norm.includes('EXP') ||
    norm.includes('BONUS') ||
    norm.includes('PERCENT') ||
    norm.includes('RATIO') ||
    norm.includes('GROWTH') ||
    norm.includes('CODE') ||
    norm.includes('ID') ||
    norm.includes('COUNT')
  ) {
    return false;
  }

  // Direct matches
  if (
    norm === 'SALESVALUE' ||
    norm === 'SALES_VALUE' ||
    norm === 'SALESVAL' ||
    norm === 'TOTALSALES' ||
    norm === 'CURRENTMONTHSALES' ||
    norm === 'CURRENT_MONTH_SALES' ||
    norm === 'CURRENTSALES' ||
    norm === 'LASTMONTHSALES' ||
    norm === 'LAST_MONTH_SALES' ||
    norm === 'LASTSALES' ||
    norm === 'SALES' ||
    norm === 'NETSALES' ||
    norm === 'VALUE' ||
    norm === 'VAL' ||
    norm === 'AMOUNT' ||
    norm === 'SALESBDT' ||
    norm === 'SALES_BDT' ||
    norm === 'SALESLAC' ||
    norm === 'SALES_LAC'
  ) {
    return true;
  }

  // Dynamic headers like SALES-UPTO-5-SEP, SALES-UPTO-5-AUG, SALES UPTO 31-JUL
  if (
    norm.startsWith('SALESUPTO') ||
    (norm.includes('SALES') && norm.includes('UPTO')) ||
    (norm.includes('UPTO') && (norm.includes('AUG') || norm.includes('SEP') || norm.includes('JUL') || norm.includes('JUN') || norm.includes('OCT') || norm.includes('NOV') || norm.includes('DEC') || norm.includes('JAN') || norm.includes('FEB') || norm.includes('MAR') || norm.includes('APR') || norm.includes('MAY')))
  ) {
    return true;
  }

  // Any header containing SALES (that survived the exclude filter)
  if (norm.includes('SALES')) {
    return true;
  }

  // Date range headers e.g. "01-AUG-26 to 05-AUG-2026", "01-SEP-26 to 05-SEP-2026"
  if (norm.includes('TO') && (norm.includes('AUG') || norm.includes('SEP') || norm.includes('JUL') || norm.includes('26') || norm.includes('2026'))) {
    return true;
  }

  return false;
}

export function parseLastDateInfo(dateText?: string): {
  day: number;
  monthName: string;
  monthShortUpper: string;
  formattedMonth: string;
} | null {
  if (!dateText || !dateText.trim()) return null;
  const str = dateText.trim();

  // 1. All full dates in string: e.g. "01/09/26", "05/09/2026", "01-SEP-26", "05-SEP-2026", "31/08/2026"
  const fullDateRegex = /(\d{1,2})[\s\-\/\.]([A-Za-z]{3,9}|\d{1,2})[\s\-\/\.](\d{2,4})/g;
  const matches = [...str.matchAll(fullDateRegex)];
  if (matches.length > 0) {
    const target = matches[matches.length - 1]; // Take the LAST date
    const day = parseInt(target[1], 10);
    const monthRaw = target[2];
    const monthKey = monthRaw.toUpperCase();
    const monthShortUpper = MONTH_NAMES_MAP[monthKey] || monthKey.substring(0, 3);
    const formattedMonth =
      monthShortUpper.charAt(0).toUpperCase() + monthShortUpper.slice(1).toLowerCase();
    return { day, monthName: formattedMonth, monthShortUpper, formattedMonth };
  }

  // 2. Dates without year e.g. "To 05/09", "To: 05-SEP", "Upto 31 Aug", "5-Sep", "05-SEP"
  const partialRegex = /(?:To\s*[:\-]?\s*|Upto\s*[:\-]?\s*)?(\d{1,2})[\s\-\/\.]([A-Za-z]{3,9}|\d{1,2})/gi;
  const partialMatches = [...str.matchAll(partialRegex)];
  if (partialMatches.length > 0) {
    const target = partialMatches[partialMatches.length - 1];
    const day = parseInt(target[1], 10);
    const monthRaw = target[2];
    const monthKey = monthRaw.toUpperCase();
    const monthShortUpper = MONTH_NAMES_MAP[monthKey] || monthKey.substring(0, 3);
    const formattedMonth =
      monthShortUpper.charAt(0).toUpperCase() + monthShortUpper.slice(1).toLowerCase();
    return { day, monthName: formattedMonth, monthShortUpper, formattedMonth };
  }

  return null;
}

export function cleanDateRangeString(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();

  // Check "From ... To ..."
  const fromToMatch = trimmed.match(/From\s+[\d\w\-\/\.]+\s+To\s+[\d\w\-\/\.]+/i);
  if (fromToMatch) {
    return fromToMatch[0].trim();
  }

  // Check "01/09/26 to 05/09/2026" or "01-SEP-26 to 05-SEP-2026"
  const rangeMatch = trimmed.match(
    /\d{1,2}[\-\/\.][\w\d]{1,9}[\-\/\.]\d{2,4}\s*(?:to|-)\s*\d{1,2}[\-\/\.][\w\d]{1,9}[\-\/\.]\d{2,4}/i
  );
  if (rangeMatch) {
    return rangeMatch[0].trim();
  }

  // Check "To : 05/09/2026" or "To 05/09/2026"
  const toMatch = trimmed.match(/To\s*[:\-]?\s*\d{1,2}[\-\/\.][\w\d]{1,9}[\-\/\.]\d{2,4}/i);
  if (toMatch) {
    return toMatch[0].trim();
  }

  // Check "Upto 05/09/2026" or "Upto 31 Aug"
  const uptoMatch = trimmed.match(/Upto\s*[:\-]?\s*\d{1,2}[\-\/\. ]?[A-Za-z0-9]{3,9}(?:[\-\/\.]\d{2,4})?/i);
  if (uptoMatch) {
    return uptoMatch[0].trim();
  }

  if (parseLastDateInfo(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

function getCellStringVal(cell: any): string {
  if (!cell) return '';
  if (cell.w) return String(cell.w).trim();
  if (cell.v instanceof Date) return cell.v.toLocaleDateString();
  if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
  return '';
}

/**
 * Formats date text (e.g. from cell A1 "From 01/09/26 To 05/09/2026")
 * into column header (e.g. "SALES-UPTO-5-SEP").
 */
export function formatSalesUptoHeader(
  dateText?: string,
  defaultFallback = 'CURRENT MONTH SALES'
): string {
  if (!dateText || !dateText.trim()) return defaultFallback;
  const info = parseLastDateInfo(dateText);
  if (info) {
    return `SALES-UPTO-${info.day}-${info.monthShortUpper}`;
  }
  return defaultFallback;
}

/**
 * Searches cell A1 first (as requested: "Date A1 a ase, but apni A3 theke niccen, tai vol name ase.
 * A1 a HQ wise Customer's Sales for DHAKA-AZURA-POOL : From 01/09/26 To 05/09/2026 ase, apni only last date niben, jemon 5-Sep"),
 * then A2, B1, C1, and only then other header cells.
 */
export function extractDateFromWorkbook(
  workbook: XLSX.WorkBook,
  preferredSheetName?: string
): string {
  const candidateSheets = [
    preferredSheetName,
    ...workbook.SheetNames,
  ].filter((s): s is string => Boolean(s && workbook.Sheets[s]));

  const uniqueSheets = Array.from(new Set(candidateSheets));

  // 1. Check cell A1 FIRST across candidate sheets
  for (const sName of uniqueSheets) {
    const ws = workbook.Sheets[sName];
    if (!ws) continue;
    const cellA1 = ws['A1'];
    if (cellA1) {
      const val = getCellStringVal(cellA1);
      if (val && parseLastDateInfo(val)) {
        return cleanDateRangeString(val);
      }
    }
  }

  // 2. Check cells A2, B1, C1 across candidate sheets
  for (const sName of uniqueSheets) {
    const ws = workbook.Sheets[sName];
    if (!ws) continue;
    for (const cellRef of ['A2', 'B1', 'C1']) {
      const cell = ws[cellRef];
      if (cell) {
        const val = getCellStringVal(cell);
        if (val && parseLastDateInfo(val)) {
          return cleanDateRangeString(val);
        }
      }
    }
  }

  // 3. Check cells A3, A4, B3, A5 across candidate sheets ONLY if containing a verified date
  for (const sName of uniqueSheets) {
    const ws = workbook.Sheets[sName];
    if (!ws) continue;
    for (const cellRef of ['A3', 'A4', 'B3', 'A5']) {
      const cell = ws[cellRef];
      if (cell) {
        const val = getCellStringVal(cell);
        if (val && parseLastDateInfo(val)) {
          return cleanDateRangeString(val);
        }
      }
    }
  }

  // 4. Scan top 5 rows for any cell containing a verified date
  for (const sName of uniqueSheets) {
    const ws = workbook.Sheets[sName];
    if (!ws) continue;
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, raw: false });
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const row = rows[r];
      if (!row) continue;
      for (let c = 0; c < Math.min(row.length, 5); c++) {
        const val = String(row[c] || '').trim();
        if (val && parseLastDateInfo(val)) {
          return cleanDateRangeString(val);
        }
      }
    }
  }

  return '';
}

/**
 * Parses and strictly validates Last Month Sales File.
 * By default, selects Sheet 2 (HQ-Customer Sales) / second sheet (index 1).
 * Validates the 10 columns: HQ_CODE, HQ_NAME, CUST_CODE, MHL_CUST_ID, MHL_CUST_NAME, THERAPY, EXP_QTY_BOX, EXP_VALUE, SALES_QTY_BOX, SALES_VALUE
 */
export async function parseLastMonthSalesFile(
  file: File | ArrayBuffer,
  selectedSheetName?: string
): Promise<{
  customerRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[];
  salesRecords?: RawSalesRecord[];
  salesSheetName?: string;
  dateHeader?: string;
  salesUptoHeader?: string;
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

  // Default: Sheet 2 (HQ-Customer Sales) -> index 1 if available
  let targetSheetName = selectedSheetName;
  if (!targetSheetName) {
    if (sheetNames.length >= 2) {
      targetSheetName = sheetNames[1]; // Sheet 2 default
    } else {
      const namedSheet = sheetNames.find(
        (s) =>
          (s.toLowerCase().includes('hq-customer') && !s.toLowerCase().includes('product')) ||
          s.toLowerCase().includes('customer sales') ||
          s.toLowerCase() === 'sheet2'
      );
      targetSheetName = namedSheet || sheetNames[0];
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const issues: ValidationIssue[] = [];

  // Extract date range from cell A3 (or A1/A2/A4)
  const dateHeader = extractDateFromWorkbook(workbook, targetSheetName);
  const salesUptoHeader = formatSalesUptoHeader(dateHeader, 'LAST MONTH SALES');

  if (!worksheet) {
    return {
      customerRecords: [],
      dateHeader,
      salesUptoHeader,
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_CUSTOMER_SALES_COLUMNS,
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

  if (rawRows.length === 0) {
    return {
      customerRecords: [],
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_CUSTOMER_SALES_COLUMNS,
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" is empty.` }],
        rowCount: 0,
      },
    };
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
    issues.push({
      type: 'warning',
      message: `Defaulting to header row ${headerRowIndex + 1}`,
    });
  }

  const colMap = new Map<string, number>();
  detectedHeaders.forEach((colName, idx) => {
    if (colName) {
      const norm = normalizeHeader(colName);
      colMap.set(norm, idx);

      if (isSalesValueColumn(colName)) {
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
      if (
        norm === 'PRODUCTCOUNT' ||
        norm === 'PRODUCT_COUNT' ||
        norm === 'PRODCOUNT' ||
        norm === 'PROD_COUNT' ||
        norm === 'PRODUCT' ||
        norm === 'PRODUCTS' ||
        norm === 'TOTALPRODUCT' ||
        norm === 'NOOFPRODUCT' ||
        norm === 'NOOFPRODUCTS' ||
        norm === 'THERAPY' ||
        norm === 'THERAPYNAME'
      ) {
        colMap.set('PRODUCT_COUNT', idx);
      }
      if (norm === 'EXPQTYBOX' || norm === 'EXP_QTY_BOX' || norm === 'EXPQTY') {
        colMap.set('EXP_QTY_BOX', idx);
      }
      if (norm === 'EXPVALUE' || norm === 'EXP_VALUE' || norm === 'EXPVAL') {
        colMap.set('EXP_VALUE', idx);
      }
      if (norm === 'SALESQTYBOX' || norm === 'SALES_QTY_BOX' || norm === 'SALESQTY') {
        colMap.set('SALES_QTY_BOX', idx);
      }
    }
  });

  // Check missing expected columns
  const missingCols: string[] = [];
  EXPECTED_CUSTOMER_SALES_COLUMNS.forEach((exp) => {
    const norm = normalizeHeader(exp);
    const found =
      colMap.has(norm) ||
      colMap.has(exp) ||
      detectedHeaders.some((h) => normalizeHeader(h) === norm);
    if (!found) {
      missingCols.push(exp);
    }
  });

  if (missingCols.length > 0) {
    issues.push({
      type: 'warning',
      message: `Missing ${missingCols.length} expected columns: ${missingCols.join(', ')}`,
    });
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
      PRODUCT_COUNT: 5,
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
    let val = getColVal(row, colName, 0);
    if ((val === 0 || val === undefined || val === null || val === '') && colName === 'SALES_VALUE') {
      for (let c = 0; c < row.length; c++) {
        const header = detectedHeaders[c];
        if (header && isSalesValueColumn(header)) {
          const v = row[c];
          if (v !== undefined && v !== null && v !== '') {
            val = v;
            break;
          }
        }
      }
    }
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

    const prodCountVal = getColVal(row, 'PRODUCT_COUNT') || getColVal(row, 'THERAPY');

    records.push({
      id: `last_month_cust_${r}_${custCode}`,
      HQ_CODE: hqCode,
      HQ_NAME: cleanKey(getColVal(row, 'HQ_NAME')),
      CUST_CODE: custCode,
      MHL_CUST_ID: cleanKey(getColVal(row, 'MHL_CUST_ID')),
      MHL_CUST_NAME: cleanKey(getColVal(row, 'MHL_CUST_NAME')),
      PRODUCT_COUNT: prodCountVal !== '' ? prodCountVal : '-',
      THERAPY: cleanKey(prodCountVal),
      EXP_QTY_BOX: getNumVal(row, 'EXP_QTY_BOX'),
      EXP_VALUE: getNumVal(row, 'EXP_VALUE'),
      SALES_QTY_BOX: getNumVal(row, 'SALES_QTY_BOX'),
      SALES_VALUE: salesVal,
      rawRowIndex: r + 1,
    });
  }

  const isValid = records.length > 0;

  // Search workbook for the best sheet containing product/brand sales:
  // User explicitly instructed:
  // "ইউজার যখন last month sales file আপলোড করবে , তখন সেই ফাইল এর চার নাম্বার সিটে , Brand wise sales value পাবেন সেখান থেকে।"
  let salesRecords: RawSalesRecord[] | undefined;
  let salesSheetName: string | undefined;
  const candidateSheets: string[] = [];

  // 1) 4th sheet (index 3) is strictly top priority as explicitly requested
  if (sheetNames.length >= 4) {
    candidateSheets.push(sheetNames[3]);
  }

  // 2) Sheets explicitly named with Sheet 4 / HQ-Customer-Product / Product / Brand
  sheetNames.forEach((s) => {
    const sLower = s.toLowerCase();
    if (
      (sLower.includes('sheet 4') ||
        sLower.includes('sheet4') ||
        sLower.includes('product') ||
        sLower.includes('brand') ||
        sLower.includes('hq-customer-product')) &&
      !candidateSheets.includes(s) &&
      !sLower.includes('chemist') &&
      s !== targetSheetName
    ) {
      candidateSheets.push(s);
    }
  });

  // 3) Any other sheet that is not chemist or pivot
  sheetNames.forEach((s) => {
    const sLower = s.toLowerCase();
    if (
      !candidateSheets.includes(s) &&
      s !== targetSheetName &&
      !sLower.includes('chemist') &&
      !sLower.includes('pivot')
    ) {
      candidateSheets.push(s);
    }
  });

  // Try candidate sheets in order until we extract valid sales records
  for (const sheetCandidate of candidateSheets) {
    try {
      const prodRes = parseSalesRecordsFromWorkbook(workbook, sheetCandidate);
      if (prodRes.records.length > 0) {
        salesRecords = prodRes.records;
        salesSheetName = prodRes.sheetName;
        break;
      }
    } catch {
      // Continue to next candidate
    }
  }

  return {
    customerRecords: records,
    salesRecords,
    salesSheetName,
    dateHeader,
    salesUptoHeader,
    workbook,
    validation: {
      isValid,
      sheetName: targetSheetName,
      availableSheets: sheetNames,
      detectedColumns: detectedHeaders.filter(Boolean),
      missingColumns: missingCols,
      issues,
      dateHeader,
      salesUptoHeader,
      rowCount: records.length,
    },
  };
}

/**
 * Helper to parse a Sheet 4 (HQ-Customer-Product Sales) or HQ Wise Brand from workbook
 */
export function parseSalesRecordsFromWorkbook(
  workbook: XLSX.WorkBook,
  customSheetName?: string
): {
  records: RawSalesRecord[];
  sheetName: string;
} {
  const sheetNames = workbook.SheetNames;
  let targetSheetName = customSheetName;

  if (!targetSheetName) {
    if (sheetNames.length >= 4) {
      targetSheetName = sheetNames[3];
    } else {
      const namedSheet = sheetNames.find(
        (s) =>
          s.toLowerCase().includes('hq-customer-product') ||
          s.toLowerCase().includes('hq wise brand') ||
          (s.toLowerCase().includes('product') && !s.toLowerCase().includes('chemist'))
      );
      targetSheetName = namedSheet || sheetNames[0];
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

  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const matchCount = EXPECTED_SALES_COLUMNS.filter((exp) =>
      normalizedRow.includes(normalizeHeader(exp))
    ).length;

    // Check if it matches raw sales columns (>=3) or HQ WISE BRAND columns (FLM, HQ, BRAND)
    const hasBrandCol = normalizedRow.some((c) => c === 'BRAND' || c.includes('BRAND'));
    const hasHqCol = normalizedRow.some((c) => c === 'HQ' || c === 'HQNAME' || c.includes('HQ'));

    if (matchCount >= 3 || (hasBrandCol && hasHqCol)) {
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
      colMap.set(cleanKey(colName).toUpperCase(), idx);

      if (
        norm === 'BRAND' ||
        norm === 'BRANDNAME' ||
        norm === 'BRAND_NAME' ||
        norm === 'PRODUCTBRAND' ||
        norm === 'PRODUCT' ||
        norm === 'PRODUCTNAME' ||
        (norm.includes('BRAND') && !norm.includes('ITEM') && !norm.includes('CUST'))
      ) {
        colMap.set('BRAND', idx);
        colMap.set('BRANDNAME', idx);
        colMap.set('PRODUCT', idx);
      }
      if (isSalesValueColumn(colName)) {
        colMap.set('SALES_VALUE', idx);
        colMap.set('SALESVALUE', idx);
        colMap.set('SALESVAL', idx);
        colMap.set('SALES', idx);
        colMap.set('CURRENT_MONTH_SALES', idx);
        colMap.set('CURRENTMONTHSALES', idx);
        colMap.set('LAST_MONTH_SALES', idx);
        colMap.set('LASTMONTHSALES', idx);
      }
      if (
        norm === 'CUSTCODE' ||
        norm === 'CUSTOMERCODE' ||
        norm === 'CUST_CODE' ||
        norm === 'CUSTOMER_CODE' ||
        norm === 'CUSTID' ||
        norm === 'CHEMISTCODE'
      ) {
        colMap.set('CUST_CODE', idx);
        colMap.set('CUSTCODE', idx);
      }
      if (norm === 'HQCODE' || norm === 'HQ_CODE') {
        colMap.set('HQ_CODE', idx);
        colMap.set('HQCODE', idx);
      }
      if (
        norm === 'HQNAME' ||
        norm === 'HQ_NAME' ||
        norm === 'HQ' ||
        norm === 'TERRITORY' ||
        norm === 'TERRITORYNAME'
      ) {
        colMap.set('HQ_NAME', idx);
        colMap.set('HQNAME', idx);
        colMap.set('HQ', idx);
      }
      if (
        norm === 'FLM' ||
        norm === 'FLMNAME' ||
        norm === 'FLM_NAME' ||
        norm === 'MANAGER' ||
        norm === 'FSM' ||
        norm === 'FSMNAME'
      ) {
        colMap.set('FLM', idx);
        colMap.set('FLMNAME', idx);
        colMap.set('FSM', idx);
      }
      if (norm === 'MHLCUSTID' || norm === 'MHL_CUST_ID' || norm === 'MHLCODE') {
        colMap.set('MHL_CUST_ID', idx);
      }
      if (norm === 'MHLCUSTNAME' || norm === 'MHL_CUST_NAME') {
        colMap.set('MHL_CUST_NAME', idx);
      }
      if (norm === 'ITEMCODE' || norm === 'ITEM_CODE') {
        colMap.set('ITEM_CODE', idx);
      }
      if (norm === 'ITEMNAME' || norm === 'ITEM_NAME') {
        colMap.set('ITEM_NAME', idx);
      }
      if (norm === 'ITEMSER' || norm === 'ITEM_SER') {
        colMap.set('ITEM_SER', idx);
      }
      if (norm === 'SALESPACK' || norm === 'SALES_PACK') {
        colMap.set('SALES_PACK', idx);
      }
      if (norm === 'THERAPY' || norm === 'THERAPYNAME') {
        colMap.set('THERAPY', idx);
      }
      if (norm === 'EXPQTYBOX' || norm === 'EXP_QTY_BOX' || norm === 'EXPQTY') {
        colMap.set('EXP_QTY_BOX', idx);
      }
      if (norm === 'EXPVALUE' || norm === 'EXP_VALUE' || norm === 'EXPVAL') {
        colMap.set('EXP_VALUE', idx);
      }
      if (norm === 'SALESQTYBOX' || norm === 'SALES_QTY_BOX' || norm === 'SALESQTY') {
        colMap.set('SALES_QTY_BOX', idx);
      }
    }
  });

  const getColVal = (row: any[], colName: string, defaultVal: any = '') => {
    const norm = normalizeHeader(colName);
    const cleanCol = cleanKey(colName).toUpperCase();
    const idx = colMap.get(norm) ?? colMap.get(colName) ?? colMap.get(cleanCol);
    if (idx !== undefined && idx < row.length) {
      const val = row[idx];
      if (val !== undefined && val !== null && val !== '') return val;
    }
    const directIdx = detectedHeaders.findIndex(
      (h) => normalizeHeader(h) === norm || cleanKey(h).toUpperCase() === cleanCol
    );
    if (directIdx !== -1 && directIdx < row.length) {
      const val = row[directIdx];
      if (val !== undefined && val !== null && val !== '') return val;
    }
    const positionalFallback: Record<string, number> = {
      HQ_CODE: 0,
      HQ_NAME: 1,
      CUST_CODE: 2,
      MHL_CUST_ID: 3,
      MHL_CUST_NAME: 4,
      THERAPY: 5,
      BRAND: 6,
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
      if (val !== undefined && val !== null && val !== '') return val;
    }
    return defaultVal;
  };

  const getNumVal = (row: any[], colName: string): number => {
    let val = getColVal(row, colName, undefined);
    if ((val === undefined || val === null || val === '') && (colName === 'SALES_VALUE' || colName === 'SALESVALUE')) {
      const altKeys = [
        'SALES_VALUE',
        'SALESVALUE',
        'SALES',
        'SALESVAL',
        'CURRENT_MONTH_SALES',
        'CURRENTMONTHSALES',
        'LAST_MONTH_SALES',
        'LASTMONTHSALES',
        'NET_SALES',
        'TOTAL_SALES',
      ];
      for (const k of altKeys) {
        const alt = getColVal(row, k, undefined);
        if (alt !== undefined && alt !== null && alt !== '') {
          val = alt;
          break;
        }
      }
      // Scan row for any column detected as sales value
      if (val === undefined || val === null || val === '') {
        for (let c = 0; c < row.length; c++) {
          const header = detectedHeaders[c];
          if (header && isSalesValueColumn(header)) {
            const cellVal = row[c];
            if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
              val = cellVal;
              break;
            }
          }
        }
      }
      // Fallback for summary tables with <= 8 columns: pick rightmost positive number
      if ((val === undefined || val === null || val === '') && row.length <= 8) {
        for (let c = row.length - 1; c >= 2; c--) {
          const cellVal = row[c];
          if (typeof cellVal === 'number' && !isNaN(cellVal) && cellVal > 0) {
            val = cellVal;
            break;
          }
        }
      }
    }
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Sample sales values to detect if sheet is already formatted in Lac (e.g. 0.10, 1.00)
  const sampleSalesValues: number[] = [];
  for (let r = headerRowIndex + 1; r < Math.min(rawRows.length, headerRowIndex + 50); r++) {
    const row = rawRows[r];
    if (row) {
      const v = getNumVal(row, 'SALES_VALUE');
      if (v > 0) sampleSalesValues.push(v);
    }
  }
  const isAlreadyInLac =
    sampleSalesValues.length > 0 &&
    sampleSalesValues.every((v) => v < 1000) &&
    sampleSalesValues.some((v) => !Number.isInteger(v) || v < 100);

  const records: RawSalesRecord[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const custCode = cleanKey(getColVal(row, 'CUST_CODE'));
    const hqCode = cleanKey(getColVal(row, 'HQ_CODE'));
    const hqName = cleanKey(getColVal(row, 'HQ_NAME')) || cleanKey(getColVal(row, 'HQ'));
    const flmName = cleanKey(getColVal(row, 'FLM'));
    const brand = cleanKey(getColVal(row, 'BRAND')) || 'OTHER';
    let salesVal = getNumVal(row, 'SALES_VALUE');

    // Skip subtotal and grand total rows if reading from an already exported sheet
    if (
      brand.toUpperCase().includes('TOTAL') ||
      hqName.toUpperCase().includes('TOTAL') ||
      custCode.toUpperCase().includes('TOTAL')
    ) {
      continue;
    }

    if (!custCode && !hqCode && !hqName && brand === 'OTHER' && salesVal === 0) continue;

    // If file was already in Lac, scale back to BDT so internal pipeline remains consistent
    if (isAlreadyInLac) {
      salesVal = Math.round(salesVal * 100000);
    }

    records.push({
      id: `sales_${r}_${custCode || hqName}`,
      HQ_CODE: hqCode,
      HQ_NAME: hqName,
      HQ: hqName || undefined,
      FLM: flmName || undefined,
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

  return { records, sheetName: targetSheetName };
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
    if (sheetNames.length >= 2) {
      targetSheetName = sheetNames[1]; // Sheet 2 (index 1) default!
    } else {
      const namedSheet = sheetNames.find(
        (s) =>
          (s.toLowerCase().includes('hq-customer') && !s.toLowerCase().includes('product')) ||
          s.toLowerCase().includes('customer sales') ||
          s.toLowerCase() === 'sheet2'
      );
      targetSheetName = namedSheet || sheetNames[0];
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

      if (isSalesValueColumn(colName)) {
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
      if (
        norm === 'PRODUCTCOUNT' ||
        norm === 'PRODUCT_COUNT' ||
        norm === 'PRODCOUNT' ||
        norm === 'PROD_COUNT' ||
        norm === 'PRODUCT' ||
        norm === 'PRODUCTS' ||
        norm === 'TOTALPRODUCT' ||
        norm === 'NOOFPRODUCT' ||
        norm === 'NOOFPRODUCTS' ||
        norm === 'THERAPY' ||
        norm === 'THERAPYNAME'
      ) {
        colMap.set('PRODUCT_COUNT', idx);
      }
    }
  });

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
      PRODUCT_COUNT: 5,
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
    let val = getColVal(row, colName, 0);
    if ((val === 0 || val === undefined || val === null || val === '') && colName === 'SALES_VALUE') {
      for (let c = 0; c < row.length; c++) {
        const header = detectedHeaders[c];
        if (header && isSalesValueColumn(header)) {
          const v = row[c];
          if (v !== undefined && v !== null && v !== '') {
            val = v;
            break;
          }
        }
      }
    }
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

    const prodCountVal = getColVal(row, 'PRODUCT_COUNT') || getColVal(row, 'THERAPY');

    records.push({
      id: `cust_sales_${r}_${custCode}`,
      HQ_CODE: hqCode,
      HQ_NAME: cleanKey(getColVal(row, 'HQ_NAME')),
      CUST_CODE: custCode,
      MHL_CUST_ID: cleanKey(getColVal(row, 'MHL_CUST_ID')),
      MHL_CUST_NAME: cleanKey(getColVal(row, 'MHL_CUST_NAME')),
      PRODUCT_COUNT: prodCountVal !== '' ? prodCountVal : '-',
      THERAPY: cleanKey(prodCountVal),
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
  salesUptoHeader?: string;
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

  // Extract date range (priority: cell A1 as requested)
  let dateHeader = extractDateFromWorkbook(workbook, targetSheetName);
  if (!dateHeader && worksheet) {
    const cellA1 = worksheet['A1'];
    if (cellA1) {
      const val = getCellStringVal(cellA1);
      if (val && parseLastDateInfo(val)) {
        dateHeader = cleanDateRangeString(val);
      }
    }
  }
  const salesUptoHeader = formatSalesUptoHeader(dateHeader, 'CURRENT MONTH SALES');

  if (!worksheet) {
    return {
      records: [],
      customerRecords: [],
      customerSheetName,
      dateHeader: '',
      salesUptoHeader,
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
      if (norm === 'MHLCUSTID' || norm === 'MHL_CUST_ID' || norm === 'MHLCODE') {
        colMap.set('MHL_CUST_ID', idx);
      }
      if (norm === 'MHLCUSTNAME' || norm === 'MHL_CUST_NAME') {
        colMap.set('MHL_CUST_NAME', idx);
      }
      if (norm === 'ITEMCODE' || norm === 'ITEM_CODE') {
        colMap.set('ITEM_CODE', idx);
      }
      if (norm === 'ITEMNAME' || norm === 'ITEM_NAME') {
        colMap.set('ITEM_NAME', idx);
      }
      if (norm === 'ITEMSER' || norm === 'ITEM_SER') {
        colMap.set('ITEM_SER', idx);
      }
      if (norm === 'SALESPACK' || norm === 'SALES_PACK') {
        colMap.set('SALES_PACK', idx);
      }
      if (norm === 'EXPQTYBOX' || norm === 'EXP_QTY_BOX' || norm === 'EXPQTY') {
        colMap.set('EXP_QTY_BOX', idx);
      }
      if (norm === 'EXPVALUE' || norm === 'EXP_VALUE' || norm === 'EXPVAL') {
        colMap.set('EXP_VALUE', idx);
      }
      if (norm === 'SALESQTYBOX' || norm === 'SALES_QTY_BOX' || norm === 'SALESQTY') {
        colMap.set('SALES_QTY_BOX', idx);
      }
      if (norm === 'THERAPY' || norm === 'THERAPYNAME') {
        colMap.set('THERAPY', idx);
      }
    }
  });

  // Check missing expected columns
  const missingCols: string[] = [];
  EXPECTED_SALES_COLUMNS.forEach((exp) => {
    const norm = normalizeHeader(exp);
    const found =
      colMap.has(norm) ||
      colMap.has(exp) ||
      detectedHeaders.some((h) => normalizeHeader(h) === norm);
    if (!found) {
      missingCols.push(exp);
    }
  });

  if (missingCols.length > 0) {
    issues.push({
      type: 'warning',
      message: `Missing ${missingCols.length} expected columns: ${missingCols.join(', ')}`,
    });
  }

  // Fallback positional indexing if not matched by name:
  // Col A: HQ_CODE (0)
  // Col B: HQ_NAME (1)
  // Col C: CUST_CODE (2)
  // Col D: MHL_CUST_ID (3)
  // Col E: MHL_CUST_NAME (4)
  // Col F: THERAPY (5)
  // Col G: BRAND (6)
  // Col H: ITEM_CODE (7)
  // Col I: ITEM_NAME (8)
  // Col J: ITEM_SER (9)
  // Col K: SALES_PACK (10)
  // Col L: EXP_QTY_BOX (11)
  // Col M: EXP_VALUE (12)
  // Col N: SALES_QTY_BOX (13)
  // Col O: SALES_VALUE (14)
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
      BRAND: 6,
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
    salesUptoHeader,
    workbook,
    validation: {
      isValid,
      sheetName: targetSheetName,
      availableSheets: sheetNames,
      detectedColumns: detectedHeaders.filter(Boolean),
      missingColumns: missingCols,
      issues,
      dateHeader,
      salesUptoHeader,
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

  if (rawRows.length === 0) {
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
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" is empty.` }],
        rowCount: 0,
      },
    };
  }

  // Find header row in first 10 rows
  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const hasCustCode = normalizedRow.some(
      (h) => h === 'CUSTCODE' || h === 'CUSTOMERCODE' || h === 'CUST_CODE' || h.includes('CUST')
    );
    const hasFlmOrFsm = normalizedRow.some((h) => h.includes('FSM') || h.includes('FLM'));

    if (hasCustCode && hasFlmOrFsm) {
      headerRowIndex = r;
      detectedHeaders = row.map((cell: any) => cleanKey(cell));
      break;
    }
  }

  if (headerRowIndex === -1) {
    for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
      const row = rawRows[r] || [];
      const normalizedRow = row.map(normalizeHeader);
      if (normalizedRow.some((h) => h.includes('CUST') || h.includes('CODE'))) {
        headerRowIndex = r;
        detectedHeaders = row.map((cell: any) => cleanKey(cell));
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    detectedHeaders = (rawRows[0] || []).map((c: any) => cleanKey(c));
    issues.push({
      type: 'warning',
      message: 'Chemist List header row defaulted to row 1.',
    });
  }

  // Map columns
  let custCodeIdx = -1;
  let custNameIdx = -1;
  let flmIdx = -1;
  let hqIdx = -1;
  let slNoIdx = -1;
  let mhlCodeIdx = -1;
  let addressIdx = -1;
  let depotIdx = -1;
  let rsmIdx = -1;

  detectedHeaders.forEach((colName, idx) => {
    const norm = normalizeHeader(colName);
    if (!norm) return;

    if (
      norm === 'CUSTCODE' ||
      norm === 'CUSTOMERCODE' ||
      norm === 'CUST_CODE' ||
      norm === 'CUSTID' ||
      norm === 'CODE'
    ) {
      if (custCodeIdx === -1) custCodeIdx = idx;
    } else if (norm === 'CUSTNAME' || norm === 'CUSTOMERNAME' || norm === 'CHEMISTNAME') {
      custNameIdx = idx;
    } else if (
      norm.includes('FSMNEW') ||
      norm.includes('FSM-(NEW)') ||
      norm.includes('FSM(NEW)') ||
      norm.includes('FSM-NEW') ||
      norm === 'FSM' ||
      norm === 'FLM' ||
      norm.includes('FLM')
    ) {
      flmIdx = idx;
    } else if (
      norm.includes('AZURAHQ(NEWDESIGN)') ||
      norm.includes('AZURAHQ') ||
      norm.includes('NEWDESIGN') ||
      norm === 'HQ' ||
      norm === 'AZURAHQ' ||
      (norm.includes('HQ') && !norm.includes('CODE'))
    ) {
      hqIdx = idx;
    } else if (norm === 'SLNO' || norm === 'SL') {
      slNoIdx = idx;
    } else if (norm === 'MHLCODE' || norm === 'MHLCUSTID') {
      mhlCodeIdx = idx;
    } else if (norm.includes('ADDRESS')) {
      addressIdx = idx;
    } else if (norm.includes('DEPOT')) {
      depotIdx = idx;
    } else if (norm.includes('RSM')) {
      rsmIdx = idx;
    }
  });

  // Positional fallback for Chemist Sheet:
  // Column C: Cust code (index 2)
  // Column D: Cust name (index 3)
  // Column I: FSM-(NEW)2026-27 (index 8) -> FLM
  // Column K: AZURA HQ ( New Design)-2026-27 (index 10) -> HQ
  if (custCodeIdx === -1 && detectedHeaders.length > 2) custCodeIdx = 2;
  if (custNameIdx === -1 && detectedHeaders.length > 3) custNameIdx = 3;
  if (flmIdx === -1 && detectedHeaders.length > 8) flmIdx = 8;
  if (hqIdx === -1 && detectedHeaders.length > 10) hqIdx = 10;

  const chemistMap = new Map<string, ChemistRecord>();
  const chemistList: ChemistRecord[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawCustCode = custCodeIdx !== -1 && custCodeIdx < row.length ? row[custCodeIdx] : '';
    const cleanCustCode = cleanKey(rawCustCode);

    if (!cleanCustCode) continue;

    const custName =
      custNameIdx !== -1 && custNameIdx < row.length ? cleanKey(row[custNameIdx]) : '';
    const rawFlm = flmIdx !== -1 && flmIdx < row.length ? row[flmIdx] : '';
    const rawHq = hqIdx !== -1 && hqIdx < row.length ? row[hqIdx] : '';

    const flmName = normalizeFlmName(rawFlm);
    const hqName = normalizeHqName(rawHq);

    const record: ChemistRecord = {
      slNo: slNoIdx !== -1 && slNoIdx < row.length ? row[slNoIdx] : r,
      mhlCode: mhlCodeIdx !== -1 && mhlCodeIdx < row.length ? cleanKey(row[mhlCodeIdx]) : '',
      custCode: cleanCustCode,
      custName: custName,
      address: addressIdx !== -1 && addressIdx < row.length ? cleanKey(row[addressIdx]) : '',
      nameOfDepot: depotIdx !== -1 && depotIdx < row.length ? cleanKey(row[depotIdx]) : '',
      rsm: rsmIdx !== -1 && rsmIdx < row.length ? cleanKey(row[rsmIdx]) : '',
      fsmNew2627: flmName,
      azuraHqNew2627: hqName,
    };

    chemistMap.set(cleanCustCode, record);
    // Also index normalized numeric code (e.g. without leading zeros or with string conversion)
    const upperCode = cleanCustCode.toUpperCase();
    if (upperCode !== cleanCustCode) {
      chemistMap.set(upperCode, record);
    }

    chemistList.push(record);
  }

  const missingChemistCols: string[] = [];
  if (custCodeIdx === -1) missingChemistCols.push('Cust code (Column C)');
  if (flmIdx === -1) missingChemistCols.push('FSM-(NEW)2026-27 (Column I / FLM)');
  if (hqIdx === -1) missingChemistCols.push('AZURA HQ ( New Design)-2026-27 (Column K / HQ)');

  return {
    chemistMap,
    chemistList,
    workbook,
    validation: {
      isValid: chemistList.length > 0,
      sheetName: targetSheetName,
      availableSheets: sheetNames,
      detectedColumns: detectedHeaders.filter(Boolean),
      missingColumns: missingChemistCols,
      issues,
      rowCount: chemistList.length,
    },
  };
}

/**
 * Enriches Sales Records (Sheet 4) with FLM and HQ via VLOOKUP matching
 *
 * Rules:
 * 1. P2: FLM = VLOOKUP from Chemist List Column I [FSM-(NEW)2026-27]
 * 2. Q2: HQ  = VLOOKUP from Chemist List Column K [AZURA HQ ( New Design)-2026-27]
 */
export function enrichSalesWithChemist(
  salesRecords: RawSalesRecord[],
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

  const enrichedRecords: SalesRecord[] = salesRecords.map((rec) => {
    const custKey = cleanKey(rec.CUST_CODE);
    let chemist = chemistMap.get(custKey);

    if (!chemist && custKey) {
      chemist = chemistMap.get(custKey.toUpperCase());
    }

    // Try without leading zeros or trimmed
    if (!chemist && custKey) {
      const stripped = custKey.replace(/^0+/, '');
      if (stripped && stripped !== custKey) {
        chemist = chemistMap.get(stripped);
      }
    }

    let flm = (rec as any).FLM || 'Unassigned FLM';
    let hq = (rec as any).HQ || rec.HQ_NAME || 'Unassigned HQ';
    let isMatched = false;

    if (chemist) {
      flm = chemist.fsmNew2627 || flm;
      hq = chemist.azuraHqNew2627 || hq;
      isMatched = true;
      matchedCount++;
    } else {
      unmatchedCount++;
      if (rec.CUST_CODE) {
        unmatchedSet.add(rec.CUST_CODE);
      }
    }

    return {
      ...rec,
      FLM: flm,
      HQ: hq,
      isMatched,
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
 * Enriches Sheet 2 (HQ-Customer Sales) in Standard Mode
 * Appends:
 * - K2: FLM = VLOOKUP from Chemist List Column I [FSM-(NEW)2026-27]
 * - L2: HQ  = VLOOKUP from Chemist List Column K [AZURA HQ ( New Design)-2026-27]
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

  const enrichedCustomerRecords: CustomerSalesRecord[] = customerRecords.map((rec) => {
    const custKey = cleanKey(rec.CUST_CODE);
    let chemist = chemistMap.get(custKey);

    if (!chemist && custKey) {
      chemist = chemistMap.get(custKey.toUpperCase());
    }
    if (!chemist && custKey) {
      const stripped = custKey.replace(/^0+/, '');
      if (stripped && stripped !== custKey) {
        chemist = chemistMap.get(stripped);
      }
    }

    let flm = 'Unassigned FLM';
    let hq = rec.HQ_NAME || 'Unassigned HQ';
    let isMatched = false;

    if (chemist) {
      flm = chemist.fsmNew2627 || 'Unassigned FLM';
      hq = chemist.azuraHqNew2627 || rec.HQ_NAME || 'Unassigned HQ';
      isMatched = true;
      matchedCount++;
    } else {
      unmatchedCount++;
    }

    return {
      ...rec,
      FLM: flm,
      HQ: hq,
      isMatched,
    };
  });

  return {
    enrichedCustomerRecords,
    matchedCount,
    unmatchedCount,
  };
}

/**
 * Month-on-Month Comparison & Enrichment for Sheet 2 (HQ-Customer Sales)
 *
 * Requirements:
 * 1. Sheet 2 columns:
 *    Col A..J: HQ_CODE, HQ_NAME, CUST_CODE, MHL_CUST_ID, MHL_CUST_NAME, THERAPY, EXP_QTY_BOX, EXP_VALUE, SALES_QTY_BOX
 *    Col K: SALES_VALUE_CURRENT
 *    Col L: SALES_VALUE_LAST
 *    Col M: Deficit = SALES_VALUE_CURRENT - SALES_VALUE_LAST (negative in red text)
 *    Col N: FLM (VLOOKUP from Chemist List Col I)
 *    Col O: HQ (VLOOKUP from Chemist List Col K)
 *
 * 2. Full outer join: Includes chemists present in current month and/or last month.
 */
export function compareAndEnrichCustomerSales(
  currentRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[],
  lastMonthRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[],
  chemistMap: Map<string, ChemistRecord>
): {
  enrichedCustomerRecords: CustomerSalesRecord[];
  matchedCount: number;
  unmatchedCount: number;
  totalDeficit: number;
  totalCurrentSales: number;
  totalLastSales: number;
} {
  // Aggregate current month by CUST_CODE
  const currentMap = new Map<string, Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>>();
  currentRecords.forEach((rec) => {
    const key = cleanKey(rec.CUST_CODE);
    if (key) {
      if (currentMap.has(key)) {
        const existing = currentMap.get(key)!;
        existing.SALES_VALUE += rec.SALES_VALUE;
        existing.SALES_QTY_BOX += rec.SALES_QTY_BOX;
        existing.EXP_VALUE += rec.EXP_VALUE;
        existing.EXP_QTY_BOX += rec.EXP_QTY_BOX;
      } else {
        currentMap.set(key, { ...rec });
      }
    }
  });

  // Aggregate last month by CUST_CODE
  const lastMap = new Map<string, Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>>();
  lastMonthRecords.forEach((rec) => {
    const key = cleanKey(rec.CUST_CODE);
    if (key) {
      if (lastMap.has(key)) {
        const existing = lastMap.get(key)!;
        existing.SALES_VALUE += rec.SALES_VALUE;
        existing.SALES_QTY_BOX += rec.SALES_QTY_BOX;
        existing.EXP_VALUE += rec.EXP_VALUE;
        existing.EXP_QTY_BOX += rec.EXP_QTY_BOX;
      } else {
        lastMap.set(key, { ...rec });
      }
    }
  });

  // Collect union of all customer codes
  const allCustCodes = new Set<string>();
  currentMap.forEach((_, code) => allCustCodes.add(code));
  lastMap.forEach((_, code) => allCustCodes.add(code));

  let matchedCount = 0;
  let unmatchedCount = 0;
  let totalDeficit = 0;
  let totalCurrentSales = 0;
  let totalLastSales = 0;

  const enrichedCustomerRecords: CustomerSalesRecord[] = [];

  allCustCodes.forEach((custCode) => {
    const cur = currentMap.get(custCode);
    const last = lastMap.get(custCode);

    const isCurrentOnly = !!cur && !last;
    const isLastMonthOnly = !cur && !!last;

    const baseRec = cur || last!;
    const curSalesVal = cur ? cur.SALES_VALUE : 0;
    const lastSalesVal = last ? last.SALES_VALUE : 0;
    const deficit = curSalesVal - lastSalesVal;

    totalCurrentSales += curSalesVal;
    totalLastSales += lastSalesVal;
    totalDeficit += deficit;

    // VLOOKUP Chemist
    let chemist = chemistMap.get(custCode);
    if (!chemist && custCode) {
      chemist = chemistMap.get(custCode.toUpperCase());
    }
    if (!chemist && custCode) {
      const stripped = custCode.replace(/^0+/, '');
      if (stripped && stripped !== custCode) {
        chemist = chemistMap.get(stripped);
      }
    }

    let flm = 'Unassigned FLM';
    let hq = baseRec.HQ_NAME || 'Unassigned HQ';
    let isMatched = false;

    if (chemist) {
      flm = chemist.fsmNew2627 || 'Unassigned FLM';
      hq = chemist.azuraHqNew2627 || baseRec.HQ_NAME || 'Unassigned HQ';
      isMatched = true;
      matchedCount++;
    } else {
      unmatchedCount++;
    }

    enrichedCustomerRecords.push({
      ...baseRec,
      id: `compare_${custCode}`,
      SALES_VALUE: curSalesVal,
      SALES_VALUE_CURRENT: curSalesVal,
      SALES_VALUE_LAST: lastSalesVal,
      deficit: deficit,
      isLastMonthOnly,
      isCurrentMonthOnly: isCurrentOnly,
      FLM: flm,
      HQ: hq,
      isMatched,
    });
  });

  // Sort by Deficit ascending (largest drops first)
  enrichedCustomerRecords.sort((a, b) => (a.deficit || 0) - (b.deficit || 0));

  return {
    enrichedCustomerRecords,
    matchedCount,
    unmatchedCount,
    totalDeficit,
    totalCurrentSales,
    totalLastSales,
  };
}
