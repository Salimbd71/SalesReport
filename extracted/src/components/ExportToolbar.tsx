import React from 'react';
import {
  Download,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  Sparkles,
  Calendar,
  Building2,
  Users,
  Loader2
} from 'lucide-react';
import { PivotTableData, SalesRecord } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { getConsolidatedFileName } from '../utils/excelExporter';

interface ExportToolbarProps {
  salesRecords: SalesRecord[];
  pivotData: PivotTableData;
  dateHeader: string;
  onExportConsolidated: () => void;
  onExportPivot?: () => void;
  isExportingConsolidated?: boolean;
  isExportingPivot?: boolean;
  isCompareMode?: boolean;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  salesRecords,
  pivotData,
  dateHeader,
  onExportConsolidated,
  isExportingConsolidated = false,
  isCompareMode = false,
}) => {
  const { t, language } = useThemeLanguage();
  const dynamicFileName = getConsolidatedFileName(dateHeader);

  return (
    <div id="export-section" className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-700/60 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
        
        {/* Left side: Export descriptions */}
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Download className="w-4 h-4" />
            <span>{t.readyForExport}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {t.generatedWorkbooksTitle}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {t.exportDesc}
          </p>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 sm:p-3">
              <div className="text-[11px] text-slate-400">{t.totalSalesValue}</div>
              <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-0.5">
                ৳{pivotData.grandTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 sm:p-3">
              <div className="text-[11px] text-slate-400">{t.totalRecords}</div>
              <div className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                {salesRecords.length.toLocaleString()} {t.rows}
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 sm:p-3">
              <div className="text-[11px] text-slate-400">{t.flmManagers}</div>
              <div className="text-sm sm:text-base font-bold text-blue-400 font-mono mt-0.5">
                {pivotData.flmGroups.length} {t.flms}
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 sm:p-3">
              <div className="text-[11px] text-slate-400">{t.activeBrands}</div>
              <div className="text-sm sm:text-base font-bold text-teal-400 font-mono mt-0.5">
                {pivotData.brands.length} {language === 'bn' ? 'টি ব্র্যান্ড' : 'Brands'}
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Single consolidated export button with dynamic date range filename */}
        <div className="flex flex-col gap-3 shrink-0 lg:max-w-md w-full lg:w-auto">
          
          <button
            id="btn-download-consolidated-main"
            onClick={onExportConsolidated}
            disabled={isExportingConsolidated}
            className="group px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-xl shadow-emerald-950/40 transition-all flex items-center justify-between space-x-4 text-xs cursor-pointer border border-emerald-400/40"
          >
            <div className="flex items-center space-x-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                {isExportingConsolidated ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base tracking-tight font-mono text-emerald-100 group-hover:text-white transition-colors">
                  {isExportingConsolidated ? t.generatingFile : dynamicFileName}
                </div>
                <div className="text-[11px] text-emerald-200/90 mt-0.5">
                  {isExportingConsolidated
                    ? isCompareMode
                      ? (language === 'bn' ? 'HQ Wise Brand সহ ৬টি শীট সংকলন করা হচ্ছে...' : 'Compiling 6 sheets including HQ Wise Brand & MoM...')
                      : (language === 'bn' ? 'HQ Wise Brand সহ ৫টি শীট সংকলন করা হচ্ছে...' : 'Compiling 5 sheets including HQ Wise Brand...')
                    : isCompareMode
                    ? (language === 'bn' ? 'তুলনামূলক ৬টি প্রফেশনাল শীট সহ এক্সেল ফাইল ডাউনলোড' : 'Download Complete 6-Sheet Excel File with HQ Wise Brand')
                    : (language === 'bn' ? 'HQ Wise Brand সহ ৫টি প্রফেশনাল শীট ডাউনলোড' : 'Download 5-Sheet Excel File with HQ Wise Brand')}
                </div>
              </div>
            </div>
            {isExportingConsolidated ? (
              <Loader2 className="w-5 h-5 text-emerald-200 animate-spin shrink-0" />
            ) : (
              <Download className="w-5 h-5 text-emerald-200 group-hover:translate-y-0.5 transition-transform shrink-0" />
            )}
          </button>

          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>
              {isCompareMode
                ? (language === 'bn' ? '✓ পিভট, Current Month vs Last Month ও HQ Wise Brand সহ ৬টি শীট' : '✓ Includes Pivot, MoM, HQ Wise Brand & Chemist List (6 sheets)')
                : (language === 'bn' ? '✓ পিভট টেবিল ও HQ Wise Brand সহ ৫টি শীট' : '✓ Includes Pivot, HQ Wise Brand & Chemist List (5 sheets)')}
            </span>
            <span className="text-emerald-400 font-medium">
              .xlsx format
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

