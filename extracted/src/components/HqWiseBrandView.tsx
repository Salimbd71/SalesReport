import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { HqWiseBrandData, HqWiseBrandItem } from '../types';
import { exportHqWiseBrandFile } from '../utils/excelExporter';

interface HqWiseBrandViewProps {
  data: HqWiseBrandData;
  dateHeader: string;
  onExportConsolidated?: () => void;
  language?: 'bn' | 'en';
}

export const HqWiseBrandView: React.FC<HqWiseBrandViewProps> = ({
  data,
  dateHeader,
  onExportConsolidated,
  language = 'bn',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlm, setSelectedFlm] = useState<string>('ALL');
  const [selectedHq, setSelectedHq] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'hq' | 'brand' | 'currentSales' | 'lastSales' | 'deficit'>('hq');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLacMode, setIsLacMode] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isExporting, setIsExporting] = useState(false);

  // Conversion helper: 10,000 = 0.10, 100,000 = 1.00
  const formatSales = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '-';
    if (isLacMode) {
      const lacVal = val / 100000;
      return lacVal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filter options
  const flmOptions = useMemo(() => {
    const set = new Set<string>();
    data.items.forEach((item) => {
      if (item.flm) set.add(item.flm);
    });
    return Array.from(set).sort();
  }, [data.items]);

  const hqOptions = useMemo(() => {
    const set = new Set<string>();
    data.items.forEach((item) => {
      if (item.hq) set.add(item.hq);
    });
    return Array.from(set).sort();
  }, [data.items]);

  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    data.items.forEach((item) => {
      if (item.brand) set.add(item.brand);
    });
    return Array.from(set).sort();
  }, [data.items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...data.items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.hq.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.flm.toLowerCase().includes(q)
      );
    }

    if (selectedFlm !== 'ALL') {
      result = result.filter((item) => item.flm === selectedFlm);
    }

    if (selectedHq !== 'ALL') {
      result = result.filter((item) => item.hq === selectedHq);
    }

    if (selectedBrand !== 'ALL') {
      result = result.filter((item) => item.brand === selectedBrand);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'hq') {
        comparison = a.hq.localeCompare(b.hq);
        if (comparison === 0) comparison = a.brand.localeCompare(b.brand);
      } else if (sortField === 'brand') {
        comparison = a.brand.localeCompare(b.brand);
        if (comparison === 0) comparison = a.hq.localeCompare(b.hq);
      } else if (sortField === 'currentSales') {
        comparison = a.currentSales - b.currentSales;
      } else if (sortField === 'lastSales') {
        comparison = (a.lastSales || 0) - (b.lastSales || 0);
      } else if (sortField === 'deficit') {
        comparison = (a.deficit || 0) - (b.deficit || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data.items, searchQuery, selectedFlm, selectedHq, selectedBrand, sortField, sortDirection]);

  // Build display items with HQ TOTAL injected per HQ
  const displayItems = useMemo(() => {
    if (sortField !== 'hq') {
      return filteredItems;
    }

    // Group filtered items by HQ
    const grouped = new Map<string, {
      flm: string;
      items: HqWiseBrandItem[];
      curTotal: number;
      lastTotal: number;
    }>();

    filteredItems.forEach((item) => {
      if (!grouped.has(item.hq)) {
        grouped.set(item.hq, {
          flm: item.flm,
          items: [],
          curTotal: 0,
          lastTotal: 0,
        });
      }
      const g = grouped.get(item.hq)!;
      g.items.push(item);
      g.curTotal += item.currentSales;
      if (item.lastSales !== undefined) {
        g.lastTotal += item.lastSales;
      }
    });

    const result: HqWiseBrandItem[] = [];
    grouped.forEach((g, hq) => {
      result.push(...g.items);
      const hqDeficit = data.isCompareMode ? g.curTotal - g.lastTotal : undefined;
      result.push({
        flm: g.flm,
        hq,
        brand: 'HQ TOTAL',
        currentSales: g.curTotal,
        lastSales: data.isCompareMode ? g.lastTotal : undefined,
        deficit: hqDeficit,
        isHqTotal: true,
      });
    });

    return result;
  }, [filteredItems, sortField, data.isCompareMode]);

  // Filtered Totals
  const filteredTotals = useMemo(() => {
    let current = 0;
    let last = 0;
    filteredItems.forEach((item) => {
      current += item.currentSales;
      if (item.lastSales !== undefined) last += item.lastSales;
    });
    return {
      currentSales: current,
      lastSales: last,
      deficit: current - last,
      count: filteredItems.length,
    };
  }, [filteredItems]);

  // Pagination based on displayItems
  const totalPages = Math.ceil(displayItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayItems.slice(start, start + pageSize);
  }, [displayItems, currentPage, pageSize]);

  const handleSort = (field: 'hq' | 'brand' | 'currentSales' | 'lastSales' | 'deficit') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'hq' || field === 'brand' ? 'asc' : 'desc');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      await exportHqWiseBrandFile(data, dateHeader, 'HQ WISE BRAND.xlsx');
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="hq-wise-brand-view-container" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {language === 'bn' ? 'HQ ওয়াইজ ব্র্যান্ড সেলস রিপোর্ট' : 'HQ Wise Brand Sales Report'}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                HQ Wise Brand
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'bn'
                ? 'HQ অনুযায়ী প্রতিটি ব্র্যান্ডের বিক্রয় বিশ্লেষণ। Sort by HQ হিসেবে সাজানো।'
                : 'Brand-level sales performance grouped by Headquarter. Sorted by HQ.'}
              {dateHeader && <span className="font-semibold text-slate-700 ml-1">({dateHeader})</span>}
            </p>
          </div>

          {/* Action Buttons & Currency Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lac Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium text-slate-600">
              <button
                id="hq-brand-toggle-lac-btn"
                onClick={() => setIsLacMode(true)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  isLacMode
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="10,000 = 0.10 | 100,000 = 1.00 Lac"
              >
                {language === 'bn' ? 'লাখ মোড (Lac 0.10/1.00)' : 'Lac Mode (0.10 / 1.00)'}
              </button>
              <button
                id="hq-brand-toggle-bdt-btn"
                onClick={() => setIsLacMode(false)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  !isLacMode
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? 'টাকা (BDT Full)' : 'BDT (Full Amount)'}
              </button>
            </div>

            {/* Export Standalone Button */}
            <button
              id="export-hq-wise-brand-btn"
              onClick={handleExport}
              disabled={isExporting || data.items.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export HQ Wise Brand (.xlsx)'}</span>
            </button>

            {onExportConsolidated && (
              <button
                id="export-consolidated-from-hq-brand-btn"
                onClick={onExportConsolidated}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Consolidated File</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-500 block">
              {language === 'bn' ? 'মোট HQ সংখ্যা' : 'Total HQs'}
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{data.uniqueHqCount}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-500 block">
              {language === 'bn' ? 'মোট ব্র্যান্ড' : 'Total Brands'}
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{data.uniqueBrandCount}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-500 block">
              {language === 'bn' ? 'রেকর্ড সংখ্যা' : 'Total Rows'}
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{data.items.length.toLocaleString()}</span>
          </div>

          <div className="bg-teal-50/80 p-3 rounded-lg border border-teal-200">
            <span className="text-[11px] font-semibold text-teal-800 block">
              {language === 'bn' ? 'চলতি মাস বিক্রয় (All HQ)' : 'Current Month Sales'}
            </span>
            <div className="text-base font-bold text-teal-900 mt-0.5 flex items-baseline gap-1">
              <span>{formatSales(filteredTotals.currentSales)}</span>
              <span className="text-[10px] font-medium text-teal-700">{isLacMode ? 'Lac' : 'BDT'}</span>
            </div>
          </div>

          {data.isCompareMode && (
            <>
              <div className="bg-indigo-50/80 p-3 rounded-lg border border-indigo-200">
                <span className="text-[11px] font-semibold text-indigo-800 block">
                  {language === 'bn' ? 'গত মাস বিক্রয় (All HQ)' : 'Last Month Sales'}
                </span>
                <div className="text-base font-bold text-indigo-900 mt-0.5 flex items-baseline gap-1">
                  <span>{formatSales(filteredTotals.lastSales)}</span>
                  <span className="text-[10px] font-medium text-indigo-700">{isLacMode ? 'Lac' : 'BDT'}</span>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  filteredTotals.deficit < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : filteredTotals.deficit > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold block">
                    {language === 'bn' ? 'ঘাটতি / উদ্বৃত্ত (Deficit)' : 'Deficit / Growth'}
                  </span>
                  {filteredTotals.deficit < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  ) : filteredTotals.deficit > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  ) : null}
                </div>
                <div className="text-base font-bold mt-0.5 flex items-baseline gap-1">
                  <span>{formatSales(filteredTotals.deficit)}</span>
                  <span className="text-[10px] font-medium">{isLacMode ? 'Lac' : 'BDT'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="hq-brand-search-input"
              type="text"
              placeholder={language === 'bn' ? 'HQ, Brand বা FLM খুঁজুন...' : 'Search HQ, Brand, FLM...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* FLM Filter */}
          <div>
            <select
              id="hq-brand-flm-filter"
              value={selectedFlm}
              onChange={(e) => {
                setSelectedFlm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
            >
              <option value="ALL">All FLMs ({flmOptions.length})</option>
              {flmOptions.map((flm) => (
                <option key={flm} value={flm}>
                  {flm}
                </option>
              ))}
            </select>
          </div>

          {/* HQ Filter */}
          <div>
            <select
              id="hq-brand-hq-filter"
              value={selectedHq}
              onChange={(e) => {
                setSelectedHq(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
            >
              <option value="ALL">All HQs ({hqOptions.length})</option>
              {hqOptions.map((hq) => (
                <option key={hq} value={hq}>
                  {hq}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              id="hq-brand-brand-filter"
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
            >
              <option value="ALL">All Brands ({brandOptions.length})</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th
                  onClick={() => handleSort('hq')}
                  className="py-3 px-4 text-slate-100 cursor-pointer hover:bg-slate-800 transition select-none w-48"
                >
                  <div className="flex items-center gap-1.5">
                    <span>FLM</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('hq')}
                  className="py-3 px-4 text-slate-100 cursor-pointer hover:bg-slate-800 transition select-none w-44"
                >
                  <div className="flex items-center gap-1.5">
                    <span>HQ</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('brand')}
                  className="py-3 px-4 text-slate-100 cursor-pointer hover:bg-slate-800 transition select-none w-44"
                >
                  <div className="flex items-center gap-1.5">
                    <span>BRAND</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('currentSales')}
                  className="py-3 px-4 text-right text-teal-300 cursor-pointer hover:bg-slate-800 transition select-none w-40"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>CURRENT MONTH SALES</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-400" />
                  </div>
                </th>
                {data.isCompareMode && (
                  <>
                    <th
                      onClick={() => handleSort('lastSales')}
                      className="py-3 px-4 text-right text-indigo-300 cursor-pointer hover:bg-slate-800 transition select-none w-40"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>LAST MONTH SALES</span>
                        <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('deficit')}
                      className="py-3 px-4 text-right text-rose-300 cursor-pointer hover:bg-slate-800 transition select-none w-36"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>DEFICIT</span>
                        <ArrowUpDown className="w-3 h-3 text-rose-400" />
                      </div>
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={data.isCompareMode ? 6 : 4}
                    className="py-12 text-center text-slate-400 text-xs"
                  >
                    {language === 'bn'
                      ? 'কোনো তথ্য পাওয়া যায়নি। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                      : 'No records match your filters.'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const def = item.deficit || 0;
                  const isNegative = def < 0;
                  const isPositive = def > 0;

                  if (item.isHqTotal) {
                    return (
                      <tr
                        key={`hq-total-${item.hq}-${idx}`}
                        className="bg-amber-50/90 border-y-2 border-amber-300 font-semibold hover:bg-amber-100/80 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-semibold text-amber-900 truncate max-w-[200px]" title={item.flm}>
                          {item.flm}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-amber-950 truncate max-w-[180px]" title={item.hq}>
                          {item.hq}
                        </td>
                        <td className="py-2.5 px-4 font-black text-amber-950">
                          <span className="inline-block px-2.5 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-300 font-mono text-[11px] font-black tracking-wider">
                            HQ TOTAL
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-amber-950 font-mono">
                          {formatSales(item.currentSales)}
                        </td>
                        {data.isCompareMode && (
                          <>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800 font-mono">
                              {formatSales(item.lastSales)}
                            </td>
                            <td
                              className={`py-2.5 px-4 text-right font-black font-mono ${
                                isNegative
                                  ? 'text-rose-700'
                                  : isPositive
                                  ? 'text-emerald-700'
                                  : 'text-amber-900'
                              }`}
                            >
                              {formatSales(item.deficit)}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={`${item.hq}-${item.brand}-${idx}`}
                      className="hover:bg-indigo-50/40 transition-colors group"
                    >
                      <td className="py-2.5 px-4 font-normal text-slate-600 truncate max-w-[200px]" title={item.flm}>
                        {item.flm}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 truncate max-w-[180px]" title={item.hq}>
                        {item.hq}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 truncate max-w-[180px]" title={item.brand}>
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200/60 font-mono text-[11px]">
                          {item.brand}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 font-mono">
                        {formatSales(item.currentSales)}
                      </td>
                      {data.isCompareMode && (
                        <>
                          <td className="py-2.5 px-4 text-right font-normal text-slate-600 font-mono">
                            {formatSales(item.lastSales)}
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-bold font-mono ${
                              isNegative
                                ? 'text-rose-600'
                                : isPositive
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {formatSales(item.deficit)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Sticky Bottom Total Row */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                <td className="py-3 px-4 text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span>All HQ Total</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-300">All HQs</td>
                <td className="py-3 px-4 text-slate-400">All Brands</td>
                <td className="py-3 px-4 text-right font-mono text-teal-300">
                  {formatSales(filteredTotals.currentSales)}
                </td>
                {data.isCompareMode && (
                  <>
                    <td className="py-3 px-4 text-right font-mono text-indigo-300">
                      {formatSales(filteredTotals.lastSales)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono ${
                        filteredTotals.deficit < 0
                          ? 'text-rose-400'
                          : filteredTotals.deficit > 0
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatSales(filteredTotals.deficit)}
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 gap-3">
          <div className="text-xs text-slate-500">
            {language === 'bn' ? 'দেখাচ্ছে' : 'Showing'}{' '}
            <span className="font-semibold text-slate-800">
              {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, filteredItems.length)}
            </span>{' '}
            {language === 'bn' ? 'মোট' : 'of'}{' '}
            <span className="font-semibold text-slate-800">{filteredItems.length.toLocaleString()}</span>{' '}
            {language === 'bn' ? 'টি সারির মধ্যে' : 'rows'}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>{language === 'bn' ? 'প্রতি পেজে:' : 'Per page:'}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="hq-brand-prev-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-700 px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                id="hq-brand-next-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
