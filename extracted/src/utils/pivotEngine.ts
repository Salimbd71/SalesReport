import { FLMGroupPivot, PivotRowData, PivotTableData, SalesRecord } from '../types';
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
