import {
  CustomerSalesRecord,
  FLMGroupPivot,
  MonthComparisonData,
  ComparisonItem,
  ComparisonFlmGroup,
  ComparisonHqItem,
  PivotRowData,
  PivotTableData,
  SalesRecord,
  HqWiseBrandItem,
  HqWiseBrandGroup,
  HqWiseBrandData,
} from '../types';
import { normalizeFlmName, normalizeHqName } from './excelParser';

export interface PivotOptions {
  sortBy?: 'name' | 'sales_desc' | 'sales_asc';
  filterFlm?: string;
  filterHq?: string;
  filterBrand?: string;
  searchQuery?: string;
}

export function generatePivotTable(
  records: SalesRecord[],
  options: PivotOptions = {}
): PivotTableData {
  if (!records || records.length === 0) {
    return {
      brands: [],
      flmGroups: [],
      columnGrandTotals: {},
      grandTotal: 0,
      totalRecords: 0,
      matchedRecords: 0,
      unmatchedRecords: 0,
    };
  }

  // Collect unique brands and track matches
  const brandSet = new Set<string>();
  let matchedCount = 0;
  let unmatchedCount = 0;

  // Grouping map: Map<FLM, Map<HQ, { brands: Map<Brand, number>, total: number, count: number }>>
  const flmMap = new Map<
    string,
    Map<
      string,
      {
        brandValues: Map<string, number>;
        total: number;
        recordCount: number;
        customers: Set<string>;
      }
    >
  >();

  // Filter records if options are present
  const query = (options.searchQuery || '').toLowerCase().trim();

  records.forEach((rec) => {
    if (rec.isMatched) matchedCount++;
    else unmatchedCount++;

    const flm = normalizeFlmName(rec.FLM);
    const hq = normalizeHqName(rec.HQ || rec.HQ_NAME);
    const brand = (rec.BRAND || 'OTHER').trim();
    const salesVal = rec.SALES_VALUE || 0;

    // Apply quick filters if specified
    if (options.filterFlm && flm !== options.filterFlm) return;
    if (options.filterHq && hq !== options.filterHq) return;
    if (options.filterBrand && brand !== options.filterBrand) return;

    if (query) {
      const match =
        flm.toLowerCase().includes(query) ||
        hq.toLowerCase().includes(query) ||
        brand.toLowerCase().includes(query) ||
        rec.CUST_CODE.toLowerCase().includes(query) ||
        rec.MHL_CUST_NAME.toLowerCase().includes(query);
      if (!match) return;
    }

    brandSet.add(brand);

    if (!flmMap.has(flm)) {
      flmMap.set(flm, new Map());
    }
    const hqMap = flmMap.get(flm)!;

    if (!hqMap.has(hq)) {
      hqMap.set(hq, {
        brandValues: new Map(),
        total: 0,
        recordCount: 0,
        customers: new Set(),
      });
    }

    const hqEntry = hqMap.get(hq)!;
    const currentBrandVal = hqEntry.brandValues.get(brand) || 0;
    hqEntry.brandValues.set(brand, currentBrandVal + salesVal);
    hqEntry.total += salesVal;
    hqEntry.recordCount += 1;
    if (rec.CUST_CODE) hqEntry.customers.add(rec.CUST_CODE);
  });

  // Sort brands alphabetically
  const brands = Array.from(brandSet).sort((a, b) => a.localeCompare(b));

  // Compute Grand Totals
  const columnGrandTotals: Record<string, number> = {};
  brands.forEach((b) => (columnGrandTotals[b] = 0));
  let grandTotal = 0;

  // Build FLM groups
  const flmGroups: FLMGroupPivot[] = [];

  flmMap.forEach((hqMap, flmName) => {
    const hqList: PivotRowData[] = [];
    const flmSubtotal: Record<string, number> = {};
    brands.forEach((b) => (flmSubtotal[b] = 0));
    let flmTotal = 0;
    let flmRecordCount = 0;

    hqMap.forEach((data, hqName) => {
      const brandValuesRecord: Record<string, number> = {};
      brands.forEach((brand) => {
        const val = data.brandValues.get(brand) || 0;
        brandValuesRecord[brand] = val;
        flmSubtotal[brand] += val;
        columnGrandTotals[brand] += val;
      });

      flmTotal += data.total;
      grandTotal += data.total;
      flmRecordCount += data.recordCount;

      hqList.push({
        flm: flmName,
        hq: hqName,
        brandValues: brandValuesRecord,
        rowTotal: data.total,
        customerCount: data.customers.size,
        recordCount: data.recordCount,
      });
    });

    // Sort HQ rows inside this FLM
    if (options.sortBy === 'sales_desc') {
      hqList.sort((a, b) => b.rowTotal - a.rowTotal);
    } else if (options.sortBy === 'sales_asc') {
      hqList.sort((a, b) => a.rowTotal - b.rowTotal);
    } else {
      hqList.sort((a, b) => a.hq.localeCompare(b.hq));
    }

    flmGroups.push({
      flm: flmName,
      hqList,
      flmSubtotal,
      flmTotal,
      recordCount: flmRecordCount,
    });
  });

  // Sort FLM groups
  if (options.sortBy === 'sales_desc') {
    flmGroups.sort((a, b) => b.flmTotal - a.flmTotal);
  } else if (options.sortBy === 'sales_asc') {
    flmGroups.sort((a, b) => a.flmTotal - b.flmTotal);
  } else {
    flmGroups.sort((a, b) => a.flm.localeCompare(b.flm));
  }

  return {
    brands,
    flmGroups,
    columnGrandTotals,
    grandTotal,
    totalRecords: records.length,
    matchedRecords: matchedCount,
    unmatchedRecords: unmatchedCount,
  };
}

/**
 * Aggregates Month-on-Month comparison data by FLM and HQ
 * FLM: CURRENT MONTH SALES | LAST MONTH SALES | DEFICIT
 * HQ:  FLM | HQ | CURRENT MONTH SALES | LAST MONTH SALES | DEFICIT
 */
export function generateMonthComparisonData(
  customerRecords: CustomerSalesRecord[]
): MonthComparisonData {
  const flmMap = new Map<string, { currentSales: number; lastSales: number; deficit: number }>();
  const hqMap = new Map<
    string,
    { flm: string; hq: string; currentSales: number; lastSales: number; deficit: number }
  >();

  let totalCurrentSales = 0;
  let totalLastSales = 0;
  let totalDeficit = 0;

  customerRecords.forEach((rec) => {
    const flm = normalizeFlmName(rec.FLM);
    const hq = normalizeHqName(rec.HQ || rec.HQ_NAME);
    const curVal = rec.SALES_VALUE_CURRENT !== undefined ? rec.SALES_VALUE_CURRENT : (rec.SALES_VALUE || 0);
    const lastVal = rec.SALES_VALUE_LAST !== undefined ? rec.SALES_VALUE_LAST : 0;
    const defVal = rec.deficit !== undefined ? rec.deficit : (curVal - lastVal);

    totalCurrentSales += curVal;
    totalLastSales += lastVal;
    totalDeficit += defVal;

    // Aggregate by FLM
    if (!flmMap.has(flm)) {
      flmMap.set(flm, { currentSales: 0, lastSales: 0, deficit: 0 });
    }
    const flmEntry = flmMap.get(flm)!;
    flmEntry.currentSales += curVal;
    flmEntry.lastSales += lastVal;
    flmEntry.deficit += defVal;

    // Aggregate by HQ under FLM
    const hqKey = `${flm}___${hq}`;
    if (!hqMap.has(hqKey)) {
      hqMap.set(hqKey, { flm, hq, currentSales: 0, lastSales: 0, deficit: 0 });
    }
    const hqEntry = hqMap.get(hqKey)!;
    hqEntry.currentSales += curVal;
    hqEntry.lastSales += lastVal;
    hqEntry.deficit += defVal;
  });

  const flmList: ComparisonItem[] = Array.from(flmMap.entries())
    .map(([flm, data]) => ({
      flm,
      currentSales: data.currentSales,
      lastSales: data.lastSales,
      deficit: data.deficit,
    }))
    .sort((a, b) => a.flm.localeCompare(b.flm));

  const hqList: ComparisonItem[] = Array.from(hqMap.values()).sort((a, b) => {
    const flmCmp = a.flm.localeCompare(b.flm);
    if (flmCmp !== 0) return flmCmp;
    return (a.hq || '').localeCompare(b.hq || '');
  });

  const flmGroups: ComparisonFlmGroup[] = flmList.map((fItem) => {
    const flmHqs: ComparisonHqItem[] = hqList
      .filter((h) => h.flm === fItem.flm)
      .map((h) => ({
        flm: h.flm,
        hq: h.hq || '',
        currentSales: h.currentSales,
        lastSales: h.lastSales,
        deficit: h.deficit,
      }))
      .sort((a, b) => a.hq.localeCompare(b.hq));

    return {
      flm: fItem.flm,
      currentSales: fItem.currentSales,
      lastSales: fItem.lastSales,
      deficit: fItem.deficit,
      hqList: flmHqs,
    };
  });

  return {
    flmGroups,
    flmList,
    hqList,
    totalCurrentSales,
    totalLastSales,
    totalDeficit,
  };
}

/**
 * Generates canonical forms of an HQ name for robust cross-file matching.
 */
function getCanonicalHqForms(rawHq?: string | null): string[] {
  if (!rawHq) return [];
  const clean = String(rawHq).trim();
  if (!clean) return [];

  const results = new Set<string>();
  const upper = clean.toUpperCase();
  results.add(upper);

  const normalizedSpace = upper.replace(/\s+/g, ' ');
  results.add(normalizedSpace);

  // Strip common suffixes: HQ, HEADQUARTER, HEADQUARTERS, TERRITORY, DEPOT, ZONE, REGION, AREA
  const strippedSuffix = normalizedSpace
    .replace(/\b(HQ|HEADQUARTER|HEADQUARTERS|TERRITORY|DEPOT|ZONE|REGION|AREA)\b/g, '')
    .trim();
  if (strippedSuffix) {
    results.add(strippedSuffix);
  }

  // Strip common depot prefixes like "DHK-", "CTG-", "MYN-", "KHL-", "SYL-", "RAJ-", "BAR-", "RNG-", "BOG-"
  const strippedDepot = (strippedSuffix || normalizedSpace)
    .replace(/^(DHK|CTG|MYN|KHL|SYL|RAJ|BAR|RNG|BOG)[\s-_]+/i, '')
    .trim();
  if (strippedDepot) {
    results.add(strippedDepot);
  }

  // Strip leading code or numbers e.g. "101 - " or "101-"
  const strippedNumbers = strippedDepot
    .replace(/^[\d\s-_]+/, '')
    .replace(/[\d\s-_]+$/, '')
    .trim();
  if (strippedNumbers) {
    results.add(strippedNumbers);
  }

  // Strip parenthetical text like "(AZURA)", "(NEW)", "(OLD)"
  const strippedParen = strippedNumbers.replace(/\([^)]*\)/g, '').trim();
  if (strippedParen) {
    results.add(strippedParen);
  }

  // Alphanumeric canonical keys
  for (const s of Array.from(results)) {
    const alphaNum = s.replace(/[^A-Z0-9]/g, '');
    if (alphaNum && alphaNum.length >= 2) {
      results.add(alphaNum);
    }
  }

  return Array.from(results).filter(Boolean);
}

/**
 * Generates canonical forms of a Brand name for robust cross-file matching.
 */
function getCanonicalBrandForms(rawBrand?: string | null): string[] {
  if (!rawBrand) return [];
  const clean = String(rawBrand).trim();
  if (!clean) return [];

  const results = new Set<string>();
  const upper = clean.toUpperCase();
  results.add(upper);

  const normalizedSpace = upper.replace(/\s+/g, ' ');
  results.add(normalizedSpace);

  // Strip dosage form or pack size or strength at the end (e.g. "CEFUROX 500 MG" -> "CEFUROX")
  const baseBrand = normalizedSpace
    .replace(/\s+(TAB|CAP|SYP|INJ|SUSP|DROP|CREAM|OINT|GEL|\d+MG|\d+ML|\d+G|\d+IU|\d+)\b.*$/i, '')
    .trim();
  if (baseBrand && baseBrand.length >= 2) {
    results.add(baseBrand);
  }

  for (const s of Array.from(results)) {
    const alphaNum = s.replace(/[^A-Z0-9]/g, '');
    if (alphaNum && alphaNum.length >= 2) {
      results.add(alphaNum);
    }
  }

  return Array.from(results).filter(Boolean);
}

/**
 * Generates HQ Wise Brand Sales Comparison / Aggregation data.
 * Structure: FLM, HQ, BRAND, CURRENT MONTH SALES, LAST MONTH SALES, DEFICIT.
 * Sorted primarily by HQ ("Sort by HQ হবে।").
 * If isCompareMode is false (no last month uploaded), LAST MONTH SALES and DEFICIT are omitted.
 *
 * User explicitly instructed:
 * "ইউজার যখন last month sales file আপলোড করবে , তখন সেই ফাইল এর চার নাম্বার সিটে , Brand wise sales value পাবেন সেখান থেকে।
 * Vlookup করে HQ WISE BRAND SALES Value নতুন HQ WISE BRAND এর last month sales এর ভ্যালু তে বসাবেন।"
 */
export function generateHqWiseBrandData(
  currentSalesRecords: SalesRecord[],
  lastMonthSalesRecords?: SalesRecord[],
  isCompareMode: boolean = false
): HqWiseBrandData {
  if (!currentSalesRecords || currentSalesRecords.length === 0) {
    return {
      items: [],
      itemsWithTotals: [],
      hqGroups: [],
      totalCurrentSales: 0,
      totalLastSales: 0,
      totalDeficit: 0,
      uniqueHqCount: 0,
      uniqueBrandCount: 0,
      isCompareMode,
    };
  }

  // Primary store keyed by canonical Primary Key: `${primaryHq}:::${primaryBrand}`
  const currentSalesMap = new Map<string, number>();
  const lastSalesMap = new Map<string, number>();
  const displayFlmMap = new Map<string, string>();
  const displayHqMap = new Map<string, string>();
  const displayBrandMap = new Map<string, string>();

  // Lookup index to map ANY variant key `${hqVariant}:::${brandVariant}` -> primaryKey
  const currentLookupMap = new Map<string, string>();

  // 1. Aggregate current month
  currentSalesRecords.forEach((rec) => {
    const flm = normalizeFlmName(rec.FLM);
    const rawHq = rec.HQ || rec.HQ_NAME || 'Unassigned HQ';
    const rawBrand = (rec.BRAND || 'OTHER').trim();
    const sales = rec.SALES_VALUE || 0;

    const hqForms = getCanonicalHqForms(rawHq);
    const brandForms = getCanonicalBrandForms(rawBrand);

    // Pick shortest alphanumeric or canonical form as primary key
    const primaryHq = hqForms[hqForms.length - 1] || rawHq.toUpperCase();
    const primaryBrand = brandForms[brandForms.length - 1] || rawBrand.toUpperCase();
    const primaryKey = `${primaryHq}:::${primaryBrand}`;

    currentSalesMap.set(primaryKey, (currentSalesMap.get(primaryKey) || 0) + sales);

    if (!displayHqMap.has(primaryKey)) {
      displayHqMap.set(primaryKey, rawHq);
    }
    if (!displayBrandMap.has(primaryKey)) {
      displayBrandMap.set(primaryKey, rawBrand.toUpperCase());
    }
    if (flm && flm !== 'Unassigned FLM') {
      displayFlmMap.set(primaryKey, flm);
    } else if (!displayFlmMap.has(primaryKey)) {
      displayFlmMap.set(primaryKey, 'Unassigned FLM');
    }

    // Register all variant keys in currentLookupMap
    for (const hForm of hqForms) {
      for (const bForm of brandForms) {
        currentLookupMap.set(`${hForm}:::${bForm}`, primaryKey);
      }
    }
  });

  // 2. Aggregate last month if in compare mode
  const hasLastRecords = isCompareMode && lastMonthSalesRecords && lastMonthSalesRecords.length > 0;
  if (hasLastRecords) {
    lastMonthSalesRecords.forEach((rec) => {
      const flm = normalizeFlmName(rec.FLM);
      const rawHq = rec.HQ || rec.HQ_NAME || 'Unassigned HQ';
      const rawBrand = (rec.BRAND || 'OTHER').trim();
      const sales = rec.SALES_VALUE || 0;

      const hqForms = getCanonicalHqForms(rawHq);
      const brandForms = getCanonicalBrandForms(rawBrand);

      // Step A: Check if this matches an existing Current Month item via canonical lookup
      let matchedPrimaryKey: string | undefined;
      for (const hForm of hqForms) {
        for (const bForm of brandForms) {
          const testKey = `${hForm}:::${bForm}`;
          if (currentLookupMap.has(testKey)) {
            matchedPrimaryKey = currentLookupMap.get(testKey);
            break;
          }
        }
        if (matchedPrimaryKey) break;
      }

      // Step B: If not matched in current month, create a distinct primary key
      if (!matchedPrimaryKey) {
        const primaryHq = hqForms[hqForms.length - 1] || rawHq.toUpperCase();
        const primaryBrand = brandForms[brandForms.length - 1] || rawBrand.toUpperCase();
        matchedPrimaryKey = `${primaryHq}:::${primaryBrand}`;

        if (!displayHqMap.has(matchedPrimaryKey)) {
          displayHqMap.set(matchedPrimaryKey, rawHq);
        }
        if (!displayBrandMap.has(matchedPrimaryKey)) {
          displayBrandMap.set(matchedPrimaryKey, rawBrand.toUpperCase());
        }
        if (flm && flm !== 'Unassigned FLM') {
          displayFlmMap.set(matchedPrimaryKey, flm);
        } else if (!displayFlmMap.has(matchedPrimaryKey)) {
          displayFlmMap.set(matchedPrimaryKey, 'Unassigned FLM');
        }
      }

      // Add sales exactly once
      lastSalesMap.set(matchedPrimaryKey, (lastSalesMap.get(matchedPrimaryKey) || 0) + sales);
    });
  }

  // 3. Collect union of all primary keys
  const allPrimaryKeys = new Set<string>();
  currentSalesMap.forEach((_, key) => allPrimaryKeys.add(key));
  if (hasLastRecords) {
    lastSalesMap.forEach((_, key) => allPrimaryKeys.add(key));
  }

  const items: HqWiseBrandItem[] = Array.from(allPrimaryKeys).map((key) => {
    const flm = displayFlmMap.get(key) || 'Unassigned FLM';
    const hq = displayHqMap.get(key) || key.split(':::')[0];
    const brand = displayBrandMap.get(key) || key.split(':::')[1];
    const curVal = currentSalesMap.get(key) || 0;
    const lastVal = isCompareMode ? (lastSalesMap.get(key) || 0) : undefined;
    const defVal = isCompareMode ? curVal - (lastVal || 0) : undefined;

    return {
      flm,
      hq,
      brand,
      currentSales: curVal,
      lastSales: lastVal,
      deficit: defVal,
    };
  });

  // Sort primarily by HQ ("Sort by HQ হবে।"), then by BRAND
  items.sort((a, b) => {
    const hqCmp = a.hq.localeCompare(b.hq);
    if (hqCmp !== 0) return hqCmp;
    return a.brand.localeCompare(b.brand);
  });

  // Group items by HQ to generate HQ Groups and itemsWithTotals (HQ TOTAL rows)
  const hqGroupsMap = new Map<string, {
    flm: string;
    hq: string;
    items: HqWiseBrandItem[];
    totalCurrentSales: number;
    totalLastSales: number;
  }>();

  items.forEach((item) => {
    if (!hqGroupsMap.has(item.hq)) {
      hqGroupsMap.set(item.hq, {
        flm: item.flm,
        hq: item.hq,
        items: [],
        totalCurrentSales: 0,
        totalLastSales: 0,
      });
    }
    const group = hqGroupsMap.get(item.hq)!;
    group.items.push(item);
    group.totalCurrentSales += item.currentSales;
    if (item.lastSales !== undefined) {
      group.totalLastSales += item.lastSales;
    }
  });

  const hqGroups: HqWiseBrandGroup[] = [];
  const itemsWithTotals: HqWiseBrandItem[] = [];

  // Sort HQs alphabetically
  const sortedHqNames = Array.from(hqGroupsMap.keys()).sort((a, b) => a.localeCompare(b));

  sortedHqNames.forEach((hq) => {
    const groupData = hqGroupsMap.get(hq)!;
    groupData.items.sort((a, b) => a.brand.localeCompare(b.brand));

    const hqDeficit = isCompareMode
      ? groupData.totalCurrentSales - groupData.totalLastSales
      : undefined;

    hqGroups.push({
      flm: groupData.flm,
      hq: groupData.hq,
      items: groupData.items,
      totalCurrentSales: groupData.totalCurrentSales,
      totalLastSales: isCompareMode ? groupData.totalLastSales : undefined,
      totalDeficit: hqDeficit,
    });

    // Add all individual brand rows for this HQ
    itemsWithTotals.push(...groupData.items);

    // Add "HQ TOTAL" row directly below the brands of this HQ
    itemsWithTotals.push({
      flm: groupData.flm,
      hq: groupData.hq,
      brand: 'HQ TOTAL',
      currentSales: groupData.totalCurrentSales,
      lastSales: isCompareMode ? groupData.totalLastSales : undefined,
      deficit: hqDeficit,
      isHqTotal: true,
    });
  });

  let totalCurrentSales = 0;
  let totalLastSales = 0;
  items.forEach((item) => {
    totalCurrentSales += item.currentSales;
    if (item.lastSales !== undefined) totalLastSales += item.lastSales;
  });
  const totalDeficit = totalCurrentSales - totalLastSales;

  const uniqueHqCount = new Set(items.map((i) => i.hq)).size;
  const uniqueBrandCount = new Set(items.map((i) => i.brand)).size;

  return {
    items,
    itemsWithTotals,
    hqGroups,
    totalCurrentSales,
    totalLastSales,
    totalDeficit,
    uniqueHqCount,
    uniqueBrandCount,
    isCompareMode,
  };
}
