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
  Calendar,
  Loader2
} from 'lucide-react';
import { FileValidationResult } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

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
  const { t, language } = useThemeLanguage();
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
    <div id="file-upload-section" className="mb-4 sm:mb-6 w-full">
      {/* Comparison Mode Toggle Card */}
      <div
        id="toggle-comparison-mode-card"
        className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all w-full"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              isCompareMode
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              <GitCompare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t.compareModeTitle}
                </h3>
                {isCompareMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    {t.active}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {t.compareModeDesc}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden xs:inline-block">
              {isCompareMode ? t.on : t.off}
            </span>
            <button
              id="btn-toggle-comparison-mode"
              type="button"
              role="switch"
              aria-checked={isCompareMode}
              onClick={() => onToggleCompareMode(!isCompareMode)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                isCompareMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isCompareMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Cards Grid */}
      <div className={`grid grid-cols-1 ${isCompareMode ? 'lg:grid-cols-3 gap-3 sm:gap-4' : 'md:grid-cols-2 gap-3 sm:gap-4'} w-full`}>
        
        {/* Card 1: Sales Data File */}
        <div
          id="upload-card-sales"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleSalesDrop}
          className={`flex flex-col justify-between rounded-xl border-2 border-dashed p-3.5 sm:p-4 transition-all bg-white dark:bg-slate-900 shadow-sm w-full ${
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

          <div>
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                {isCompareMode ? (language === 'bn' ? 'চলতি মাস' : 'Current Month') : t.input1}
              </span>
            </div>

            <div className="mt-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                {t.currentMonthSalesTitle}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.currentMonthSalesSubtitle}
              </p>
            </div>
          </div>

          <div className="mt-3">
            {salesFileName ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-100/60 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {salesFileName}
                    </div>
                    {salesValidation && (
                      <div className="text-[10px] text-blue-700 dark:text-blue-300">
                        {salesValidation.rowCount.toLocaleString()} {t.rows} • {salesValidation.sheetName}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => salesInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                >
                  {t.changeFile}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => salesInputRef.current?.click()}
                className="w-full py-3 px-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t.selectCurrentSalesBtn}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t.dragDropHint}
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
          className={`flex flex-col justify-between rounded-xl border-2 border-dashed p-3.5 sm:p-4 transition-all bg-white dark:bg-slate-900 shadow-sm w-full ${
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

          <div>
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                {t.masterMapping}
              </span>
            </div>

            <div className="mt-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                {t.chemistMasterTitle}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.chemistMasterSubtitle}
              </p>
            </div>
          </div>

          <div className="mt-3">
            {chemistFileName ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {chemistFileName}
                    </div>
                    {chemistValidation && (
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                        {chemistValidation.rowCount.toLocaleString()} {t.chemists} • {chemistValidation.sheetName}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => chemistInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                >
                  {t.changeFile}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => chemistInputRef.current?.click()}
                className="w-full py-3 px-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t.selectChemistMasterBtn}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t.dragDropHint}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Last Month Sales File (Optional / Comparison Mode) */}
        {isCompareMode && (
          <div
            id="upload-card-last-month"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleLastMonthDrop}
            className={`flex flex-col justify-between rounded-xl border-2 border-dashed p-3.5 sm:p-4 transition-all bg-white dark:bg-slate-900 shadow-sm w-full ${
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

            <div>
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">
                  {t.prevMonth}
                </span>
              </div>

              <div className="mt-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t.lastMonthSalesTitle}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.lastMonthSalesSubtitle}
                </p>
              </div>
            </div>

            <div className="mt-3">
              {lastMonthFileName ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-100/60 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700">
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {lastMonthFileName}
                      </div>
                      {lastMonthValidation && (
                        <div className="text-[10px] text-indigo-700 dark:text-indigo-300">
                          {lastMonthValidation.rowCount.toLocaleString()} {t.customerRows} • {lastMonthValidation.sheetName}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => lastMonthInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                  >
                    {t.changeFile}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => lastMonthInputRef.current?.click()}
                  className="w-full py-3 px-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer group"
                >
                  <UploadCloud className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t.selectLastMonthSalesBtn}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {t.dragDropHint}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Prominent Action Button: Generate Sales Report */}
      <div className="mt-3.5 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${salesFileName ? 'bg-blue-600' : 'bg-slate-400'}`}>
            {salesFileName ? '✓' : '1'}
          </span>
          <span className={salesFileName ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}>
            {language === 'bn' ? 'সেলস ফাইল' : 'Sales Data'}
          </span>
          <span className="text-slate-300">→</span>
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${chemistFileName ? 'bg-emerald-600' : 'bg-slate-400'}`}>
            {chemistFileName ? '✓' : '2'}
          </span>
          <span className={chemistFileName ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}>
            {language === 'bn' ? 'কেমিস্ট ফাইল' : 'Chemist List'}
          </span>
          
          {isCompareMode && (
            <>
              <span className="text-slate-300">→</span>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${lastMonthFileName ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                {lastMonthFileName ? '✓' : '3'}
              </span>
              <span className={lastMonthFileName ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}>
                {language === 'bn' ? 'গত মাসের সেলস' : 'Last Month'}
              </span>
            </>
          )}

          <span className="text-slate-300">→</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {t.generateReportBtn}
          </span>
        </div>

        <button
          id="btn-generate-sales-report"
          onClick={onGenerateReport}
          disabled={!isReadyToGenerate || isLoading}
          className={`w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-md ${
            isReadyToGenerate && !isLoading
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
              <span>{t.processingVlookup}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>{t.generateReportBtn}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

