import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Search,
  Download,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  FileSpreadsheet,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { CustomerSalesRecord } from '../types';
import { generateMonthComparisonData } from '../utils/pivotEngine';
import { exportCurrentVsLastMonthFile } from '../utils/excelExporter';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface CurrentVsLastMonthViewProps {
  customerRecords: CustomerSalesRecord[];
  dateHeader: string;
  onExportConsolidated?: () => void;
  isExportingConsolidated?: boolean;
}

export const CurrentVsLastMonthView: React.FC<CurrentVsLastMonthViewProps> = ({
  customerRecords,
  dateHeader,
  onExportConsolidated,
  isExportingConsolidated = false,
}) => {
  const { language } = useThemeLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<'ALL' | 'DEFICIT_ONLY' | 'GROWTH_ONLY'>('ALL');
  const [unitMode, setUnitMode] = useState<'lac' | 'bdt'>('lac');
  const [collapsedFlms, setCollapsedFlms] = useState<Set<string>>(new Set());
  const [isExportingSingle, setIsExportingSingle] = useState(false);

  // Compute aggregated MoM comparison data
  const comparisonData = useMemo(() => {
    return generateMonthComparisonData(customerRecords);
  }, [customerRecords]);

  // Format currency helpers (10,000 = 0.10, 100,000 = 1.00 in Lac mode)
  const formatVal = (val: number | undefined | null) => {
    const num = val || 0;
    if (unitMode === 'lac') {
      const inLac = num / 100000;
      return inLac.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return `৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDiffVal = (val: number | undefined | null) => {
    const num = val || 0;
    const prefix = num > 0 ? '+' : '';
    if (unitMode === 'lac') {
      const inLac = num / 100000;
      return `${prefix}${inLac.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${prefix}৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Toggle single FLM group collapse state
  const toggleFlm = (flm: string) => {
    setCollapsedFlms((prev) => {
      const next = new Set(prev);
      if (next.has(flm)) {
        next.delete(flm);
      } else {
        next.add(flm);
      }
      return next;
    });
  };

  // Expand all / collapse all
  const expandAll = () => setCollapsedFlms(new Set());
  const collapseAll = () => {
    const all = new Set<string>();
    comparisonData.flmGroups.forEach((g) => all.add(g.flm));
    setCollapsedFlms(all);
  };

  // Filtered hierarchical groups
  const filteredGroups = useMemo(() => {
    return comparisonData.flmGroups
      .map((group) => {
        const q = searchTerm.toLowerCase().trim();
        const flmMatches = !q || group.flm.toLowerCase().includes(q);

        const matchingHqs = group.hqList.filter((hqItem) => {
          const hqMatches = !q || flmMatches || hqItem.hq.toLowerCase().includes(q);
          if (!hqMatches) return false;

          if (performanceFilter === 'DEFICIT_ONLY' && hqItem.deficit >= 0) return false;
          if (performanceFilter === 'GROWTH_ONLY' && hqItem.deficit <= 0) return false;

          return true;
        });

        // If filtering by performance and neither group nor children match, hide
        if (performanceFilter === 'DEFICIT_ONLY' && group.deficit >= 0 && matchingHqs.length === 0) {
          return null;
        }
        if (performanceFilter === 'GROWTH_ONLY' && group.deficit <= 0 && matchingHqs.length === 0) {
          return null;
        }

        // If search term is present and neither FLM nor any HQs matched, hide
        if (q && !flmMatches && matchingHqs.length === 0) {
          return null;
        }

        return {
          ...group,
          hqList: q || performanceFilter !== 'ALL' ? matchingHqs : group.hqList,
        };
      })
      .filter(Boolean) as typeof comparisonData.flmGroups;
  }, [comparisonData.flmGroups, searchTerm, performanceFilter]);

  // Overall totals for current filtered view
  const filteredTotals = useMemo(() => {
    let cur = 0;
    let last = 0;
    let def = 0;
    let totalHqs = 0;

    filteredGroups.forEach((g) => {
      cur += g.currentSales;
      last += g.lastSales;
      def += g.deficit;
      totalHqs += g.hqList.length;
    });

    return { cur, last, def, totalHqs };
  }, [filteredGroups]);

  // Export single comparison sheet
  const handleExportComparisonOnly = async () => {
    try {
      setIsExportingSingle(true);
      await exportCurrentVsLastMonthFile(
        customerRecords,
        dateHeader,
        `Current Month vs Last Month - ${dateHeader || 'Report'}.xlsx`
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExportingSingle(false);
    }
  };

  const isBn = language === 'bn';
  const totalGrowthPercent =
    comparisonData.totalLastSales > 0
      ? ((comparisonData.totalDeficit / comparisonData.totalLastSales) * 100).toFixed(1)
      : '0.0';
  const isNetPositive = comparisonData.totalDeficit >= 0;

  return (
    <div id="current-vs-last-month-view" className="space-y-6">
      {/* Top Banner & KPI Highlights */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-blue-800/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-blue-900/60 pb-5 mb-5">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Current Month vs Last Month
              </h2>
              <span className="bg-blue-600/30 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/40">
                {isBn ? 'পিভট স্ট্রাকচার (FLM > HQ)' : 'Pivot Structure (FLM > HQ)'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                10,000 = 0.10 | 100,000 = 1.00 (Lac)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {isBn
                ? 'FLM এর নিচে HQ সমূহ নেস্টেড আকারে প্রদর্শিত হচ্ছে। ফিগার ফরম্যাট: ১০,০০০ = ০.১০, ১,০০,০০০ = ১.০০ (লাখে)। Formula: DEFICIT = CURRENT MONTH SALES - LAST MONTH SALES।'
                : 'Month-on-Month comparison matching Pivot Table layout (FLM > HQ). Values in Lac (10,000 = 0.10, 100,000 = 1.00). Formula: DEFICIT = CURRENT MONTH SALES - LAST MONTH SALES.'}
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-export-comparison-only"
              onClick={handleExportComparisonOnly}
              disabled={isExportingSingle}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 shadow-sm cursor-pointer transition-colors"
              title="Download standalone Current Month vs Last Month .xlsx"
            >
              {isExportingSingle ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              )}
              <span>{isBn ? 'তুলনামূলক এক্সেল' : 'Export Comparison (.xlsx)'}</span>
            </button>

            {onExportConsolidated && (
              <button
                id="btn-export-consolidated-from-comparison"
                onClick={onExportConsolidated}
                disabled={isExportingConsolidated}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all border border-emerald-400/30"
              >
                {isExportingConsolidated ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>{isBn ? 'সম্পূর্ণ কনসোলিডেটেড ফাইল' : 'Export Consolidated File'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Current Month Sales */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>{isBn ? 'চলতি মাসের মোট সেলস' : 'CURRENT MONTH SALES'}</span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
              {formatVal(comparisonData.totalCurrentSales)}
            </div>
            <div className="text-xs text-blue-400 mt-1">
              {unitMode === 'lac'
                ? `৳${comparisonData.totalCurrentSales.toLocaleString()}`
                : `${(comparisonData.totalCurrentSales / 100000).toFixed(2)} Lac`}
            </div>
          </div>

          {/* Last Month Sales */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>{isBn ? 'বিগত মাসের মোট সেলস' : 'LAST MONTH SALES'}</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
              {formatVal(comparisonData.totalLastSales)}
            </div>
            <div className="text-xs text-indigo-300 mt-1">
              {unitMode === 'lac'
                ? `৳${comparisonData.totalLastSales.toLocaleString()}`
                : `${(comparisonData.totalLastSales / 100000).toFixed(2)} Lac`}
            </div>
          </div>

          {/* Net Deficit / Surplus */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>{isBn ? 'ঘাটতি / উদ্বৃত্ত (DEFICIT)' : 'NET DEFICIT / SURPLUS'}</span>
              {isNetPositive ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold tracking-tight font-mono ${
                isNetPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatDiffVal(comparisonData.totalDeficit)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  isNetPositive
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {isNetPositive ? '+' : ''}{totalGrowthPercent}% MoM
              </span>
              <span className="text-xs text-slate-400">
                {isNetPositive ? (isBn ? 'উদ্বৃত্ত/উন্নতি' : 'Surplus') : (isBn ? 'ঘাটতি' : 'Shortfall')}
              </span>
            </div>
          </div>

          {/* Scope Count */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>{isBn ? 'আওতাধীন মোট এরিয়া' : 'TOTAL REGIONS'}</span>
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
              <span>{comparisonData.flmGroups.length}</span>
              <span className="text-xs font-normal text-slate-400">FLMs</span>
              <span className="text-slate-600">/</span>
              <span>{comparisonData.hqList.length}</span>
              <span className="text-xs font-normal text-slate-400">HQs</span>
            </div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'Sheet 2 এ যুক্ত হবে' : 'Sheet 2 in Excel Output'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hierarchical Pivot-Style Table Container */}
      <div
        id="mom-nested-table-container"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        {/* Table Toolbar Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Left Title & Status */}
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {isBn ? 'FLM ও HQ ভিত্তিক সেলস পারফরম্যান্স তুলনা' : 'Current Month vs Last Month Performance'}
                </h3>
                <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-300 dark:border-blue-700">
                  {filteredGroups.length} FLMs | {filteredTotals.totalHqs} HQs
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isBn
                  ? 'FLM সারি ক্লিক করে HQ সম্প্রসারণ বা সংকুচিত করুন। কনসোলিডেটেড ফাইলে Sheet 2 হিসেবে সংরক্ষিত হবে।'
                  : 'Click on any FLM row to expand or collapse nested HQs. Output file sequence: SALES REPORT PIVOT, Current Month vs Last Month, HQ-Customer Sales, HQ-Customer-Product Sales.'}
              </p>
            </div>

            {/* Right Controls: Search, Performance Filter, Unit Mode, Expand/Collapse */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="mom-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isBn ? 'FLM বা HQ সার্চ...' : 'Search FLM or HQ...'}
                  className="pl-8 pr-7 py-1.5 bg-white dark:bg-slate-800 text-xs border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Performance Filter */}
              <div className="relative">
                <select
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value as any)}
                  className="pl-2.5 pr-6 py-1.5 bg-white dark:bg-slate-800 text-xs border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">{isBn ? 'সব রেকর্ড (All)' : 'All Records'}</option>
                  <option value="DEFICIT_ONLY">{isBn ? 'শুধু ঘাটতি (Deficit < 0)' : 'Deficit Only (< 0)'}</option>
                  <option value="GROWTH_ONLY">{isBn ? 'শুধু প্রবৃদ্ধি (Growth > 0)' : 'Growth Only (> 0)'}</option>
                </select>
              </div>

              {/* Expand / Collapse All */}
              <button
                onClick={expandAll}
                title="Expand all FLM groups"
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-1"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{isBn ? 'সব খুলুন' : 'Expand All'}</span>
              </button>
              <button
                onClick={collapseAll}
                title="Collapse all FLM groups"
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-1"
              >
                <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{isBn ? 'সব বন্ধ' : 'Collapse All'}</span>
              </button>

              {/* Unit Toggle */}
              <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700">
                <button
                  onClick={() => setUnitMode('lac')}
                  title="10,000 = 0.10, 100,000 = 1.00"
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    unitMode === 'lac'
                      ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isBn ? 'লাখ (100k = 1.00)' : 'Lac (100k = 1.00)'}
                </button>
                <button
                  onClick={() => setUnitMode('bdt')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    unitMode === 'bdt'
                      ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isBn ? 'টাকা (৳)' : '৳ BDT'}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Date Banner */}
        {dateHeader && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/50 px-5 py-2 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">{isBn ? 'রিপোর্ট তারিখ:' : 'Report Date Reference:'}</span>
            <span className="font-mono">{dateHeader}</span>
          </div>
        )}

        {/* The Nested Hierarchical Table */}
        <div className="overflow-x-auto max-h-[640px] relative">
          <table id="mom-nested-grid" className="w-full text-left border-collapse text-xs">
            {/* Table Header */}
            <thead className="bg-slate-900 text-white sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-100 min-w-[260px] border-r border-slate-800 sticky left-0 z-30 bg-slate-900">
                  FLM (First Line Manager)
                </th>
                <th className="py-3 px-4 font-semibold text-slate-100 min-w-[240px] border-r border-slate-800">
                  HQ (Headquarter)
                </th>
                <th className="py-3 px-4 font-semibold text-right text-slate-100 min-w-[170px] border-r border-slate-800">
                  CURRENT MONTH SALES {unitMode === 'lac' ? '(Lac)' : '(৳)'}
                </th>
                <th className="py-3 px-4 font-semibold text-right text-slate-100 min-w-[170px] border-r border-slate-800">
                  LAST MONTH SALES {unitMode === 'lac' ? '(Lac)' : '(৳)'}
                </th>
                <th className="py-3 px-4 font-bold text-right text-emerald-300 min-w-[170px] border-r border-slate-800">
                  DEFICIT {unitMode === 'lac' ? '(Lac)' : '(৳)'}
                </th>
                <th className="py-3 px-4 font-semibold text-center text-slate-200 min-w-[110px]">
                  {isBn ? 'প্রবৃদ্ধি %' : 'MoM Growth'}
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic text-sm">
                    {isBn ? 'কোন রেকর্ড পাওয়া যায়নি।' : 'No matching FLM or HQ records found.'}
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const isCollapsed = collapsedFlms.has(group.flm);
                  const isGroupDeficit = group.deficit < 0;
                  const isGroupGrowth = group.deficit > 0;
                  const groupPct =
                    group.lastSales > 0
                      ? ((group.deficit / group.lastSales) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <React.Fragment key={`group_${group.flm}`}>
                      {/* FLM Summary Group Header Row */}
                      <tr
                        onClick={() => toggleFlm(group.flm)}
                        className="bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100/90 dark:hover:bg-blue-900/50 cursor-pointer font-semibold transition-colors group select-none"
                      >
                        {/* FLM Column with Chevron and HQ count */}
                        <td className="py-2.5 px-4 text-blue-900 dark:text-blue-100 border-r border-blue-200 dark:border-blue-900 sticky left-0 z-10 bg-blue-50/90 dark:bg-blue-950/40 group-hover:bg-blue-100/90">
                          <div className="flex items-center space-x-2">
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-blue-600 shrink-0" />
                            )}
                            <span className="font-bold text-blue-950 dark:text-blue-100">
                              {group.flm}
                            </span>
                            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-normal">
                              ({group.hqList.length} HQs)
                            </span>
                          </div>
                        </td>

                        {/* HQ Column: All HQs Total (exact match to screenshot) */}
                        <td className="py-2.5 px-4 text-blue-800 dark:text-blue-300 font-bold border-r border-blue-200 dark:border-blue-900">
                          {isBn ? 'সকল HQ উপ-মোট' : 'All HQs Total'}
                        </td>

                        {/* Current Month Sales */}
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 border-r border-blue-200 dark:border-blue-900">
                          {formatVal(group.currentSales)}
                        </td>

                        {/* Last Month Sales */}
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-blue-200 dark:border-blue-900">
                          {formatVal(group.lastSales)}
                        </td>

                        {/* Deficit */}
                        <td className="py-2.5 px-4 text-right font-mono font-bold border-r border-blue-200 dark:border-blue-900">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isGroupDeficit
                                ? 'text-rose-600 dark:text-rose-400'
                                : isGroupGrowth
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-600'
                            }`}
                          >
                            {isGroupDeficit && <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
                            {isGroupGrowth && <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />}
                            {formatDiffVal(group.deficit)}
                          </span>
                        </td>

                        {/* MoM % */}
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isGroupDeficit
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                : isGroupGrowth
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isGroupGrowth ? '+' : ''}{groupPct}%
                          </span>
                        </td>
                      </tr>

                      {/* HQ Child Rows under this FLM */}
                      {!isCollapsed &&
                        group.hqList.map((hqItem, hqIdx) => {
                          const isHqDeficit = hqItem.deficit < 0;
                          const isHqGrowth = hqItem.deficit > 0;
                          const hqPct =
                            hqItem.lastSales > 0
                              ? ((hqItem.deficit / hqItem.lastSales) * 100).toFixed(1)
                              : '0.0';

                          return (
                            <tr
                              key={`hq_${group.flm}_${hqItem.hq}_${hqIdx}`}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              {/* FLM Column is empty with subtle connector line */}
                              <td className="py-2 px-4 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-white dark:bg-slate-900">
                                <div className="pl-6 flex items-center text-slate-300 dark:text-slate-700 text-xs">
                                  <span>└─</span>
                                </div>
                              </td>

                              {/* HQ Name */}
                              <td className="py-2 px-4 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 pl-4">
                                {hqItem.hq}
                              </td>

                              {/* HQ Current Month Sales */}
                              <td className="py-2 px-4 text-right font-mono text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                                {formatVal(hqItem.currentSales)}
                              </td>

                              {/* HQ Last Month Sales */}
                              <td className="py-2 px-4 text-right font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                                {formatVal(hqItem.lastSales)}
                              </td>

                              {/* HQ Deficit */}
                              <td className="py-2 px-4 text-right font-mono font-semibold border-r border-slate-200 dark:border-slate-800">
                                <span
                                  className={
                                    isHqDeficit
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : isHqGrowth
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-slate-500'
                                  }
                                >
                                  {formatDiffVal(hqItem.deficit)}
                                </span>
                              </td>

                              {/* HQ MoM % */}
                              <td className="py-2 px-4 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    isHqDeficit
                                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                                      : isHqGrowth
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {isHqGrowth ? '+' : ''}{hqPct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* Grand Total Footer */}
            <tfoot className="bg-slate-900 text-white sticky bottom-0 z-20 shadow-lg border-t-2 border-slate-700">
              <tr className="font-bold text-xs">
                {/* FLM Col */}
                <td className="py-3 px-4 tracking-wider uppercase border-r border-slate-800 sticky left-0 z-30 bg-slate-900 text-amber-300">
                  TOTAL
                </td>

                {/* HQ Col */}
                <td className="py-3 px-4 text-slate-300 uppercase border-r border-slate-800">
                  {isBn ? 'সকল অঞ্চল সর্বমোট' : 'All Regions Total'}
                </td>

                {/* Total Current Sales */}
                <td className="py-3 px-4 text-right font-mono text-blue-300 border-r border-slate-800 text-sm">
                  {formatVal(filteredTotals.cur)}
                </td>

                {/* Total Last Sales */}
                <td className="py-3 px-4 text-right font-mono text-indigo-300 border-r border-slate-800 text-sm">
                  {formatVal(filteredTotals.last)}
                </td>

                {/* Total Deficit */}
                <td className="py-3 px-4 text-right font-mono border-r border-slate-800 text-sm">
                  <span
                    className={
                      filteredTotals.def >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }
                  >
                    {formatDiffVal(filteredTotals.def)}
                  </span>
                </td>

                {/* Net MoM % */}
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      filteredTotals.def >= 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {filteredTotals.last > 0
                      ? `${filteredTotals.def >= 0 ? '+' : ''}${((filteredTotals.def / filteredTotals.last) * 100).toFixed(1)}%`
                      : '-'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
