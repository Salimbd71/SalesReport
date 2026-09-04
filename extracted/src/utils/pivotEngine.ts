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
 * Generates HQ Wise Brand Sales Comparison / Aggregation data.
 * Structure: FLM, HQ, BRAND, CURRENT MONTH SALES, LAST MONTH SALES, DEFICIT.
 * Sorted primarily by HQ ("Sort by HQ হবে।").
 * If isCompareMode is false (no last month uploaded), LAST MONTH SALES and DEFICIT are omitted.
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

  // Key: `${hq}:::${brand}`
  const currentMap = new Map<string, number>();
  const lastMap = new Map<string, number>();
  const cleanLastMap = new Map<string, number>();
  const hqToFlmMap = new Map<string, string>();
  // Preserve original display casing for brand
  const brandDisplayMap = new Map<string, string>();

  // Aggregate current month
  currentSalesRecords.forEach((rec) => {
    const flm = normalizeFlmName(rec.FLM);
    const hq = normalizeHqName(rec.HQ || rec.HQ_NAME);
    const rawBrand = (rec.BRAND || 'OTHER').trim();
    const brandKey = rawBrand.replace(/\s+/g, ' ').toUpperCase();
    const sales = rec.SALES_VALUE || 0;

    if (!brandDisplayMap.has(brandKey)) {
      brandDisplayMap.set(brandKey, rawBrand.toUpperCase());
    }

    const key = `${hq}:::${brandKey}`;
    currentMap.set(key, (currentMap.get(key) || 0) + sales);

    if (flm && flm !== 'Unassigned FLM' && !hqToFlmMap.has(hq)) {
      hqToFlmMap.set(hq, flm);
    } else if (!hqToFlmMap.has(hq)) {
      hqToFlmMap.set(hq, flm || 'Unassigned FLM');
    }
  });

  // Aggregate last month if in compare mode
  // As requested:
  // "ইউজার যখন last month sales file আপলোড করবে , তখন সেই ফাইল এর চার নাম্বার সিটে , Brand wise sales value পাবেন সেখান থেকে। Vlookup করে HQ WISE BRAND SALES Value নতুন HQ WISE BRAND এর last month sales এর ভ্যালু তে বসাবেন।"
  const hasLastRecords = isCompareMode && lastMonthSalesRecords && lastMonthSalesRecords.length > 0;
  if (hasLastRecords) {
    lastMonthSalesRecords.forEach((rec) => {
      const flm = normalizeFlmName(rec.FLM);
      const hq = normalizeHqName(rec.HQ || rec.HQ_NAME);
      const rawBrand = (rec.BRAND || 'OTHER').trim();
      const brandKey = rawBrand.replace(/\s+/g, ' ').toUpperCase();
      const sales = rec.SALES_VALUE || 0;

      if (!brandDisplayMap.has(brandKey)) {
        brandDisplayMap.set(brandKey, rawBrand.toUpperCase());
      }

      const key = `${hq}:::${brandKey}`;
      lastMap.set(key, (lastMap.get(key) || 0) + sales);

      // Clean secondary key without whitespace/hyphens for foolproof VLOOKUP matching
      const cleanHq = hq.replace(/[\s-_]+/g, '').toUpperCase();
      const cleanBrand = brandKey.replace(/[\s-_]+/g, '').toUpperCase();
      const cleanKey = `${cleanHq}:::${cleanBrand}`;
      cleanLastMap.set(cleanKey, (cleanLastMap.get(cleanKey) || 0) + sales);

      // Also map with rec.HQ_NAME if different
      if (rec.HQ_NAME && rec.HQ_NAME !== rec.HQ) {
        const altHq = normalizeHqName(rec.HQ_NAME);
        const altKey = `${altHq}:::${brandKey}`;
        if (!lastMap.has(altKey)) {
          lastMap.set(altKey, (lastMap.get(altKey) || 0) + sales);
        }
        const altCleanHq = altHq.replace(/[\s-_]+/g, '').toUpperCase();
        cleanLastMap.set(`${altCleanHq}:::${cleanBrand}`, (cleanLastMap.get(`${altCleanHq}:::${cleanBrand}`) || 0) + sales);
      }

      if (!hqToFlmMap.has(hq) && flm && flm !== 'Unassigned FLM') {
        hqToFlmMap.set(hq, flm);
      }
    });
  }

  // Determine all keys
  const allKeys = new Set<string>();
  currentMap.forEach((_, key) => allKeys.add(key));
  if (hasLastRecords) {
    lastMap.forEach((_, key) => allKeys.add(key));
  }

  const items: HqWiseBrandItem[] = Array.from(allKeys).map((key) => {
    const [hq, brandKey] = key.split(':::');
    const flm = hqToFlmMap.get(hq) || 'Unassigned FLM';
    const brand = brandDisplayMap.get(brandKey) || brandKey;
    const curVal = currentMap.get(key) || 0;

    // VLOOKUP resolution from Last Month's Sheet 4 data
    let lastVal: number | undefined = undefined;
    if (isCompareMode) {
      if (lastMap.has(key)) {
        lastVal = lastMap.get(key) || 0;
      } else {
        const cleanHq = hq.replace(/[\s-_]+/g, '').toUpperCase();
        const cleanBrand = brandKey.replace(/[\s-_]+/g, '').toUpperCase();
        const cleanLookupKey = `${cleanHq}:::${cleanBrand}`;
        if (cleanLastMap.has(cleanLookupKey)) {
          lastVal = cleanLastMap.get(cleanLookupKey) || 0;
        } else {
          lastVal = 0;
        }
      }
    }

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
