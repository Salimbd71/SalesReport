import React, { useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  Play,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  GitCompare,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { FileValidationResult } from '../types';

interface FileUploadCardsProps {
  salesFileName: string;
  chemistFileName: string;
  lastMonthFileName?: string;
  salesValidation?: FileValidationResult;
  chemistValidation?: FileValidationResult;
  lastMonthValidation?: FileValidationResult;
  isCompareMode: boolean;
  onToggleCompareMode: (enabled: boolean) => void;
  isLoading: boolean;
  onUploadSalesFile: (file: File) => void;
  onUploadChemistFile: (file: File) => void;
  onUploadLastMonthFile: (file: File) => void;
  onGenerateReport: () => void;
  hasReportGenerated: boolean;
}

export const FileUploadCards: React.FC<FileUploadCardsProps> = ({
  salesFileName,
  chemistFileName,
  lastMonthFileName,
  salesValidation,
  chemistValidation,
  lastMonthValidation,
  isCompareMode,
  onToggleCompareMode,
  isLoading,
  onUploadSalesFile,
  onUploadChemistFile,
  onUploadLastMonthFile,
  onGenerateReport,
  hasReportGenerated,
}) => {
  const salesInputRef = useRef<HTMLInputElement>(null);
  const chemistInputRef = useRef<HTMLInputElement>(null);
  const lastMonthInputRef = useRef<HTMLInputElement>(null);

  const handleSalesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadSalesFile(e.dataTransfer.files[0]);
    }
  };

  const handleChemistDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadChemistFile(e.dataTransfer.files[0]);
    }
  };

  const handleLastMonthDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadLastMonthFile(e.dataTransfer.files[0]);
    }
  };

  const isReadyToGenerate = isCompareMode
    ? Boolean(salesFileName && chemistFileName && lastMonthFileName)
    : Boolean(salesFileName && chemistFileName);

  return (
    <div id="file-upload-section" className="mb-8">
      
      {/* Top Banner Guide */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Excel Sales Data Processing & Pivot Generator</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Select your <strong>Sales Data file</strong> and <strong>Chemist list file</strong>, then click <strong>"Generate Sales Report"</strong>. The engine performs VLOOKUP mapping into Columns P (FLM) & Q (HQ), maps BRAND from Column G (G2), and generates multi-level Pivot tables with sales values in <strong>Lac (100,000 = 1.00)</strong>.
            </p>
          </div>
          
          
          
          

          <div className="flex items-center space-x-3 text-xs shrink-0">
  <div className="flex items-start space-x-2 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>

    <div className="text-slate-300 font-medium leading-relaxed">
      <div>
        Developed by{" "}
        <a
          href="https://fb.com/salim.naogaon"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
        >
          Salim
        </a>
        {" "}
      </div>
      <div>SO, Sun Pharmaceuticals EZ Ltd.</div>
      <div>HQ - ENGLISH ROAD-AZU-DHAKA</div>
      <div>Mail - mdsalim.hossain1@sunpharma.com</div>
      <div>Mobile - 01737462871</div>
    </div>
  </div>
</div>
          
          
          
          
          
          
          
        </div>
      </div>

      {/* Comparison Mode Toggle Card */}
      <div
        id="toggle-comparison-mode-card"
        className="mb-6 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isCompareMode
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                  Last Month Sales Comparison (HQ-Customer Sales)
                </h3>
                {isCompareMode && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 animate-pulse">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enable to upload Last Month sales report & compare Sheet 2 (HQ-Customer Sales) with <span className="font-semibold text-rose-600 dark:text-rose-400">Deficit</span> tracking.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isCompareMode ? 'Comparison ON' : 'Comparison OFF'}
            </span>
            <button
              id="btn-toggle-comparison-mode"
              type="button"
              role="switch"
              aria-checked={isCompareMode}
              onClick={() => onToggleCompareMode(!isCompareMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                isCompareMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isCompareMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {isCompareMode && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
              Sheet 2 Column: <strong className="ml-1">SALES_VALUE_CURRENT</strong>
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium">
              Sheet 2 Column: <strong className="ml-1">SALES_VALUE_LAST</strong>
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
              Sheet 2 Column: <strong className="ml-1">Deficit (- value red text)</strong>
            </span>
          </div>
        )}
      </div>

      {/* Upload Cards Grid */}
      <div className={`grid grid-cols-1 ${isCompareMode ? 'lg:grid-cols-3 gap-5' : 'md:grid-cols-2 gap-6'}`}>
      
      
      
      
        
        {/* Card 1: Sales Data File */}
        <div
          id="upload-card-sales"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleSalesDrop}
          className={`relative rounded-2xl border-2 border-dashed p-5 transition-all bg-white dark:bg-slate-900 ${
            salesFileName
              ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400'
          }`}
        >
          <input
            type="file"
            ref={salesInputRef}
            onChange={(e) => e.target.files?.[0] && onUploadSalesFile(e.target.files[0])}
            accept=".xlsx, .xls, .xlsm, .csv"
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
              {isCompareMode ? 'Current Month' : 'Input File 1'}
            </span>
          </div>

          <div className="mt-3.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              1. {isCompareMode ? 'Current Month Sales' : 'Select Sales Data File from Data Centrebd'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              শর্ত: <strong>Sun Mail এর Data Centrebd এর সেলস রিপোর্ট ফাইল আপলোড করতে হবে।</strong>
            </p>

            <div className="my-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-200">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>File Specifications:</span>
              </div>
              <p className="pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                • <strong>Cell A1:</strong> Date text preserved
              </p>
              <p className="pl-5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                • <strong>Sheet 4:</strong> Col G (BRAND), Col P2 (FLM) & Col Q2 (HQ)
              </p>
              <p className="pl-5 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                • <strong>Sheet 2:</strong> Col K2 (FLM) & Col L2 (HQ)
              </p>
            </div>

            {salesFileName ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-100/60 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileCheck2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {salesFileName}
                    </div>
                    {salesValidation && (
                      <div className="text-[11px] text-blue-700 dark:text-blue-300">
                        {salesValidation.rowCount.toLocaleString()} rows • {salesValidation.sheetName}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => salesInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => salesInputRef.current?.click()}
                className="w-full py-4 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select Current Sales (.xlsx, .xls)
                </span>
                <span className="text-[11px] text-slate-400">
                  Drag & Drop or Click to browse
                </span>
              </button>
            )}
          </div>
        </div>




        {/* Card 2: Chemist List File */}
        <div
          id="upload-card-chemist"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleChemistDrop}
          className={`relative rounded-2xl border-2 border-dashed p-5 transition-all bg-white dark:bg-slate-900 ${
            chemistFileName
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400'
          }`}
        >
          <input
            type="file"
            ref={chemistInputRef}
            onChange={(e) => e.target.files?.[0] && onUploadChemistFile(e.target.files[0])}
            accept=".xlsx, .xls, .xlsm, .csv"
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              Master Mapping
            </span>
          </div>

          <div className="mt-3.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              2. Chemist List File from RSM Sir
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              শর্ত: <strong>RSM Sir এর দেওয়া নির্দিষ্ট কেমিস্ট ফাইল আপলোড করতে হবে।</strong>
            </p>

            <div className="my-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-200">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mapping Specifications:</span>
              </div>
              <p className="pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                • <strong>Lookup Key:</strong> Cust code
              </p>
              <p className="pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                • <strong>FLM:</strong> Col I (<code>FSM-(NEW)2026-27</code>)
              </p>
              <p className="pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                • <strong>HQ:</strong> Col K (<code>AZURA HQ ( New Design)</code>)
              </p>
            </div>

            {chemistFileName ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {chemistFileName}
                    </div>
                    {chemistValidation && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        {chemistValidation.rowCount.toLocaleString()} chemists • {chemistValidation.sheetName}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => chemistInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => chemistInputRef.current?.click()}
                className="w-full py-4 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select Chemist Master (.xlsx, .xls)
                </span>
                <span className="text-[11px] text-slate-400">
                  Drag & Drop or Click to browse
                </span>
              </button>
            )}
          </div>
        </div>
        
        
        
        
        

        {/* Card 3: Last Month Sales File (Conditional on isCompareMode) */}
        {isCompareMode && (
          <div
            id="upload-card-last-month"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleLastMonthDrop}
            className={`relative rounded-2xl border-2 border-dashed p-5 transition-all bg-white dark:bg-slate-900 ${
              lastMonthFileName
                ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
            }`}
          >
            <input
              type="file"
              ref={lastMonthInputRef}
              onChange={(e) => e.target.files?.[0] && onUploadLastMonthFile(e.target.files[0])}
              accept=".xlsx, .xls, .xlsm, .csv"
              className="hidden"
            />

            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">
                Previous Month
              </span>
            </div>

            <div className="mt-3.5">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                3. Last Month Sales File From Data Centrebd.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Same format as Sales data file from data centrebd• Reads <strong>Sheet 2 (HQ-Customer Sales)</strong>
              </p>

              <div className="my-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-200">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sheet 2 (HQ-Customer Sales):</span>
                </div>
                
                <div className="pl-5 text-[11px] text-rose-600 dark:text-rose-400 font-semibold pt-0.5">
                  • <strong>Deficit:</strong> Current - Last (Negative in red text)
                </div>
              </div>

              {lastMonthFileName ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-100/60 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FileCheck2 className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {lastMonthFileName}
                      </div>
                      {lastMonthValidation && (
                        <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                          {lastMonthValidation.rowCount.toLocaleString()} rows • {lastMonthValidation.sheetName}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => lastMonthInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => lastMonthInputRef.current?.click()}
                  className="w-full py-4 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
                >
                  <UploadCloud className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Select Last Month Sales File (.xlsx, .xls)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Drag & Drop or Click to browse
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Prominent Action Button: Generate Sales Report */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${salesFileName ? 'bg-blue-600' : 'bg-slate-400'}`}>
            {salesFileName ? '✓' : '1'}
          </span>
          <span className={salesFileName ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}>Sales Data</span>
          <span className="text-slate-300">→</span>
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${chemistFileName ? 'bg-emerald-600' : 'bg-slate-400'}`}>
            {chemistFileName ? '✓' : '2'}
          </span>
          <span className={chemistFileName ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}>Chemist List</span>
          
          {isCompareMode && (
            <>
              <span className="text-slate-300">→</span>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${lastMonthFileName ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                {lastMonthFileName ? '✓' : '3'}
              </span>
              <span className={lastMonthFileName ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}>Last Month</span>
            </>
          )}

          <span className="text-slate-300">→</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Generate Report</span>
        </div>

        <button
          id="btn-generate-sales-report"
          onClick={onGenerateReport}
          disabled={!isReadyToGenerate || isLoading}
          className={`px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center space-x-3 transition-all cursor-pointer shadow-lg ${
            isReadyToGenerate && !isLoading
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing VLOOKUP & Generating Pivot...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Generate Sales Report</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
