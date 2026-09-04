/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileValidationResult,
  PivotTableData,
  SalesRecord,
  RawSalesRecord,
  CustomerSalesRecord,
  ChemistRecord,
} from './types';
import {
  parseSalesFile,
  parseChemistFile,
  parseLastMonthSalesFile,
  enrichSalesWithChemist,
  enrichCustomerSalesWithChemist,
  compareAndEnrichCustomerSales,
} from './utils/excelParser';
import { generatePivotTable, generateHqWiseBrandData } from './utils/pivotEngine';
import {
  exportConsolidatedFile,
  exportPivotReportFile,
  exportHqWiseBrandFile,
  getConsolidatedFileName,
} from './utils/excelExporter';

import { Header } from './components/Header';
import { FileUploadCards } from './components/FileUploadCards';
import { ValidationAlerts } from './components/ValidationAlerts';
import { PivotTableView } from './components/PivotTableView';
import { EnrichedDataView } from './components/EnrichedDataView';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ChemistMasterView } from './components/ChemistMasterView';
import { ExportToolbar } from './components/ExportToolbar';
import { SalimProfileCard } from './components/SalimProfileCard';
import { CurrentVsLastMonthView } from './components/CurrentVsLastMonthView';
import { HqWiseBrandView } from './components/HqWiseBrandView';
import { useThemeLanguage } from './context/ThemeLanguageContext';

import {
  Table as TableIcon,
  FileSpreadsheet,
  BarChart3,
  Users,
  CheckCircle,
  Layers,
} from 'lucide-react';

export default function App() {
  const { t, language } = useThemeLanguage();

  // Raw file state: Current Month Sales
  const [salesRawFile, setSalesRawFile] = useState<File | null>(null);
  const [salesFileName, setSalesFileName] = useState<string>('');
  
  // Raw file state: Chemist Master List
  const [chemistRawFile, setChemistRawFile] = useState<File | null>(null);
  const [chemistFileName, setChemistFileName] = useState<string>('');

  // Raw file state: Last Month Sales (for Comparison Mode)
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [lastMonthRawFile, setLastMonthRawFile] = useState<File | null>(null);
  const [lastMonthFileName, setLastMonthFileName] = useState<string>('');
  const [lastMonthValidation, setLastMonthValidation] = useState<FileValidationResult | undefined>();
  const [rawLastMonthCustomerRecords, setRawLastMonthCustomerRecords] = useState<
    Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[]
  >([]);
  const [rawLastMonthSalesRecords, setRawLastMonthSalesRecords] = useState<RawSalesRecord[]>([]);

  // Selected sheet names
  const [selectedSalesSheet, setSelectedSalesSheet] = useState<string>('');
  const [selectedChemistSheet, setSelectedChemistSheet] = useState<string>('');
  const [selectedLastMonthSheet, setSelectedLastMonthSheet] = useState<string>('');

  // Parsed records and validations
  // Sheet 4 (Product level)
  const [rawSalesRecords, setRawSalesRecords] = useState<RawSalesRecord[]>([]);
  // Sheet 2 (Customer level: HQ-Customer Sales)
  const [rawCustomerRecords, setRawCustomerRecords] = useState<
    Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[]
  >([]);
  const [customerSheetName, setCustomerSheetName] = useState<string>('HQ-Customer Sales');

  const [chemistMap, setChemistMap] = useState<Map<string, ChemistRecord>>(new Map());
  const [chemistList, setChemistList] = useState<ChemistRecord[]>([]);

  const [dateHeader, setDateHeader] = useState<string>('');
  const [salesValidation, setSalesValidation] = useState<FileValidationResult | undefined>();
  const [chemistValidation, setChemistValidation] = useState<FileValidationResult | undefined>();

  // Enriched & Pivot state
  const [enrichedRecords, setEnrichedRecords] = useState<SalesRecord[]>([]);
  const [enrichedCustomerRecords, setEnrichedCustomerRecords] = useState<CustomerSalesRecord[]>([]);
  const [enrichedLastMonthSalesRecords, setEnrichedLastMonthSalesRecords] = useState<SalesRecord[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [unmatchedCount, setUnmatchedCount] = useState<number>(0);
  const [unmatchedCodes, setUnmatchedCodes] = useState<string[]>([]);
  const [hasReportGenerated, setHasReportGenerated] = useState<boolean>(false);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'pivot' | 'enriched' | 'compare' | 'hq-brand' | 'charts' | 'chemist'>('pivot');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExportingConsolidated, setIsExportingConsolidated] = useState<boolean>(false);
  const [isExportingPivot, setIsExportingPivot] = useState<boolean>(false);
  const [isExportingHqWiseBrand, setIsExportingHqWiseBrand] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Upload Handlers
  const handleUploadSalesFile = async (file: File) => {
    setSalesRawFile(file);
    setSalesFileName(file.name);
    setHasReportGenerated(false);
    setIsLoading(true);
    try {
      const result = await parseSalesFile(file);
      setRawSalesRecords(result.records);
      setRawCustomerRecords(result.customerRecords);
      setCustomerSheetName(result.customerSheetName || 'HQ-Customer Sales');
      setDateHeader(result.dateHeader);
      setSalesValidation(result.validation);
      if (result.validation.sheetName) {
        setSelectedSalesSheet(result.validation.sheetName);
      }
      showNotification(
        `Sales Data loaded: Sheet 4 (${result.records.length.toLocaleString()} rows) & Sheet 2 (${result.customerRecords.length.toLocaleString()} rows)`
      );
    } catch (err: any) {
      console.error('Error parsing Sales file:', err);
      showNotification('Failed to read Sales Excel file: ' + err.message, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadChemistFile = async (file: File) => {
    setChemistRawFile(file);
    setChemistFileName(file.name);
    setHasReportGenerated(false);
    setIsLoading(true);
    try {
      const result = await parseChemistFile(file);
      setChemistMap(result.chemistMap);
      setChemistList(result.chemistList);
      setChemistValidation(result.validation);
      if (result.validation.sheetName) {
        setSelectedChemistSheet(result.validation.sheetName);
      }

      // Re-enrich Last Month sales records if already loaded in memory
      if (rawLastMonthSalesRecords.length > 0) {
        const enrichLastRes = enrichSalesWithChemist(rawLastMonthSalesRecords, result.chemistMap);
        setEnrichedLastMonthSalesRecords(enrichLastRes.enrichedRecords);
      }

      showNotification(`Chemist List loaded: ${result.chemistList.length.toLocaleString()} chemists`);
    } catch (err: any) {
      console.error('Error parsing Chemist file:', err);
      showNotification('Failed to read Chemist Excel file: ' + err.message, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadLastMonthFile = async (file: File) => {
    setLastMonthRawFile(file);
    setLastMonthFileName(file.name);
    setHasReportGenerated(false);
    setIsLoading(true);
    setIsCompareMode(true); // Automatically enable compare mode on file upload
    try {
      const result = await parseLastMonthSalesFile(file);
      setRawLastMonthCustomerRecords(result.customerRecords);
      if (result.salesRecords && result.salesRecords.length > 0) {
        setRawLastMonthSalesRecords(result.salesRecords);
        if (chemistMap.size > 0) {
          const enrichRes = enrichSalesWithChemist(result.salesRecords, chemistMap);
          setEnrichedLastMonthSalesRecords(enrichRes.enrichedRecords);
        }
      } else {
        setRawLastMonthSalesRecords([]);
        setEnrichedLastMonthSalesRecords([]);
      }
      setLastMonthValidation(result.validation);
      if (result.validation.sheetName) {
        setSelectedLastMonthSheet(result.validation.sheetName);
      }
      const sheet4Name = result.salesSheetName ? `Sheet 4 (${result.salesSheetName})` : 'Sheet 4';
      const salesCountMsg =
        result.salesRecords && result.salesRecords.length > 0
          ? ` & ${sheet4Name} (${result.salesRecords.length.toLocaleString()} brand sales rows mapped for VLOOKUP)`
          : '';
      showNotification(
        `Last Month Sales loaded: Sheet 2 (${result.customerRecords.length.toLocaleString()} customer rows)${salesCountMsg}`
      );
    } catch (err: any) {
      console.error('Error parsing Last Month Sales file:', err);
      showNotification('Failed to read Last Month Sales Excel file: ' + err.message, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Sheet switchers
  const handleSelectSalesSheet = async (sheetName: string) => {
    if (salesRawFile) {
      setSelectedSalesSheet(sheetName);
      setHasReportGenerated(false);
      setIsLoading(true);
      try {
        const result = await parseSalesFile(salesRawFile, sheetName);
        setRawSalesRecords(result.records);
        setRawCustomerRecords(result.customerRecords);
        setCustomerSheetName(result.customerSheetName || 'HQ-Customer Sales');
        setDateHeader(result.dateHeader);
        setSalesValidation(result.validation);
      } catch (err: any) {
        showNotification('Error changing sheet: ' + err.message, 'info');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectChemistSheet = async (sheetName: string) => {
    if (chemistRawFile) {
      setSelectedChemistSheet(sheetName);
      setHasReportGenerated(false);
      setIsLoading(true);
      try {
        const result = await parseChemistFile(chemistRawFile, sheetName);
        setChemistMap(result.chemistMap);
        setChemistList(result.chemistList);
        setChemistValidation(result.validation);
      } catch (err: any) {
        showNotification('Error changing sheet: ' + err.message, 'info');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectLastMonthSheet = async (sheetName: string) => {
    if (lastMonthRawFile) {
      setSelectedLastMonthSheet(sheetName);
      setHasReportGenerated(false);
      setIsLoading(true);
      try {
        const result = await parseLastMonthSalesFile(lastMonthRawFile, sheetName);
        setRawLastMonthCustomerRecords(result.customerRecords);
        if (result.salesRecords && result.salesRecords.length > 0) {
          setRawLastMonthSalesRecords(result.salesRecords);
          if (chemistMap.size > 0) {
            const enrichRes = enrichSalesWithChemist(result.salesRecords, chemistMap);
            setEnrichedLastMonthSalesRecords(enrichRes.enrichedRecords);
          }
        } else {
          setRawLastMonthSalesRecords([]);
          setEnrichedLastMonthSalesRecords([]);
        }
        setLastMonthValidation(result.validation);
      } catch (err: any) {
        showNotification('Error changing sheet: ' + err.message, 'info');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Explicit Generation trigger: "Generate Sales Report"
  const handleGenerateReport = async () => {
    if (!salesRawFile || !chemistRawFile) {
      showNotification('Please select both Sales Data file and Chemist List file first.', 'info');
      return;
    }

    if (isCompareMode && !lastMonthRawFile) {
      showNotification('Please select the Last Month Sales Data file to perform comparison.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      // Re-verify parsing if records aren't loaded
      let currentSales = rawSalesRecords;
      let currentCustomerSales = rawCustomerRecords;
      let currentChemistMap = chemistMap;
      let currentLastMonthCustomerSales = rawLastMonthCustomerRecords;

      if (currentSales.length === 0 || currentCustomerSales.length === 0) {
        const salesRes = await parseSalesFile(salesRawFile, selectedSalesSheet);
        currentSales = salesRes.records;
        currentCustomerSales = salesRes.customerRecords;
        setRawSalesRecords(salesRes.records);
        setRawCustomerRecords(salesRes.customerRecords);
        setCustomerSheetName(salesRes.customerSheetName);
        setDateHeader(salesRes.dateHeader);
        setSalesValidation(salesRes.validation);
      }

      if (currentChemistMap.size === 0) {
        const chemistRes = await parseChemistFile(chemistRawFile, selectedChemistSheet);
        currentChemistMap = chemistRes.chemistMap;
        setChemistMap(chemistRes.chemistMap);
        setChemistList(chemistRes.chemistList);
        setChemistValidation(chemistRes.validation);
      }

      let currentLastMonthSales = rawLastMonthSalesRecords;

      if (isCompareMode && lastMonthRawFile) {
        if (currentLastMonthSales.length === 0 || currentLastMonthCustomerSales.length === 0) {
          const lastMonthRes = await parseLastMonthSalesFile(lastMonthRawFile, selectedLastMonthSheet);
          if (lastMonthRes.customerRecords && lastMonthRes.customerRecords.length > 0) {
            currentLastMonthCustomerSales = lastMonthRes.customerRecords;
            setRawLastMonthCustomerRecords(lastMonthRes.customerRecords);
          }
          if (lastMonthRes.salesRecords && lastMonthRes.salesRecords.length > 0) {
            currentLastMonthSales = lastMonthRes.salesRecords;
            setRawLastMonthSalesRecords(lastMonthRes.salesRecords);
          }
          setLastMonthValidation(lastMonthRes.validation);
        }
      }

      // Perform VLOOKUP mapping for Sheet 4 (P2: FLM, Q2: HQ)
      const { enrichedRecords: enriched, matchedCount: mCount, unmatchedCount: uCount, unmatchedCodes: uCodes } =
        enrichSalesWithChemist(currentSales, currentChemistMap);

      // Perform mapping / comparison for Sheet 2
      let enrichedCustomer: CustomerSalesRecord[] = [];
      if (isCompareMode && currentLastMonthCustomerSales.length > 0) {
        // Compare Mode: Full outer join with last month, calculate Deficit, and enrich FLM/HQ
        const compResult = compareAndEnrichCustomerSales(
          currentCustomerSales,
          currentLastMonthCustomerSales,
          currentChemistMap
        );
        enrichedCustomer = compResult.enrichedCustomerRecords;
      } else {
        // Standard Mode: VLOOKUP mapping for Sheet 2 (K2: FLM, L2: HQ)
        const stdResult = enrichCustomerSalesWithChemist(currentCustomerSales, currentChemistMap);
        enrichedCustomer = stdResult.enrichedCustomerRecords;
      }

      // If last month sales records exist, enrich them with chemist map too
      let enrichedLastMonth: SalesRecord[] = [];
      if (isCompareMode && currentLastMonthSales.length > 0) {
        const lastEnrichRes = enrichSalesWithChemist(currentLastMonthSales, currentChemistMap);
        enrichedLastMonth = lastEnrichRes.enrichedRecords;
      }

      setEnrichedRecords(enriched);
      setEnrichedCustomerRecords(enrichedCustomer);
      setEnrichedLastMonthSalesRecords(enrichedLastMonth);
      setMatchedCount(mCount);
      setUnmatchedCount(uCount);
      setUnmatchedCodes(uCodes);
      setHasReportGenerated(true);
      setActiveTab('pivot');

      showNotification(
        `Sales Report generated! Sheet 4 (${enriched.length.toLocaleString()} rows) & Sheet 2 (${enrichedCustomer.length.toLocaleString()} rows) ${isCompareMode ? 'compared & enriched' : 'enriched'}.`
      );

      // Smooth scroll down to output
      setTimeout(() => {
        const outputSection = document.getElementById('report-output-section');
        if (outputSection) {
          outputSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Error generating sales report:', err);
      showNotification('Error generating report: ' + err.message, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute Pivot Table Data
  const pivotData: PivotTableData = useMemo(() => {
    if (!hasReportGenerated || enrichedRecords.length === 0) {
      return {
        flmGroups: [],
        brands: [],
        columnGrandTotals: {},
        grandTotal: 0,
        totalRecords: 0,
        matchedRecords: 0,
        unmatchedRecords: 0,
      };
    }
    return generatePivotTable(enrichedRecords);
  }, [enrichedRecords, hasReportGenerated]);

  // Compute HQ Wise Brand Data
  const hqWiseBrandData = useMemo(() => {
    if (!hasReportGenerated || enrichedRecords.length === 0) {
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
    const lastSalesToUse =
      enrichedLastMonthSalesRecords.length > 0
        ? enrichedLastMonthSalesRecords
        : rawLastMonthSalesRecords.length > 0
        ? enrichSalesWithChemist(rawLastMonthSalesRecords, chemistMap).enrichedRecords
        : undefined;

    return generateHqWiseBrandData(
      enrichedRecords,
      lastSalesToUse,
      isCompareMode
    );
  }, [enrichedRecords, enrichedLastMonthSalesRecords, rawLastMonthSalesRecords, chemistMap, isCompareMode, hasReportGenerated]);

  // Exports with loading indicators
  const handleExportConsolidated = async () => {
    if (enrichedRecords.length === 0) {
      showNotification('No generated report to export. Please click Generate Sales Report first.', 'info');
      return;
    }
    const dynamicName = getConsolidatedFileName(dateHeader);
    setIsExportingConsolidated(true);
    try {
      // Yield to event loop to allow loading spinner to render immediately
      await new Promise((resolve) => setTimeout(resolve, 80));
      await exportConsolidatedFile(
        enrichedRecords,
        enrichedCustomerRecords,
        pivotData,
        chemistList,
        dateHeader,
        dynamicName,
        isCompareMode,
        hqWiseBrandData
      );
      showNotification(`Downloaded: ${dynamicName}`);
    } catch (err: any) {
      console.error('Export error:', err);
      showNotification('Failed to export file: ' + (err?.message || 'Unknown error'), 'info');
    } finally {
      setIsExportingConsolidated(false);
    }
  };

  const handleExportPivot = async () => {
    if (pivotData.flmGroups.length === 0) {
      showNotification('No pivot data available. Please generate the report first.', 'info');
      return;
    }
    setIsExportingPivot(true);
    try {
      // Yield to event loop to allow loading spinner to render immediately
      await new Promise((resolve) => setTimeout(resolve, 80));
      await exportPivotReportFile(pivotData, dateHeader, 'SALES REPORT PIVOT.xlsx');
      showNotification('Downloaded: SALES REPORT PIVOT.xlsx (Value in Lac)');
    } catch (err: any) {
      console.error('Export error:', err);
      showNotification('Failed to export pivot: ' + (err?.message || 'Unknown error'), 'info');
    } finally {
      setIsExportingPivot(false);
    }
  };

  const handleExportHqWiseBrand = async () => {
    if (hqWiseBrandData.items.length === 0) {
      showNotification('No HQ Wise Brand data available to export.', 'info');
      return;
    }
    setIsExportingHqWiseBrand(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      await exportHqWiseBrandFile(hqWiseBrandData, dateHeader);
      showNotification('Downloaded: HQ WISE BRAND.xlsx');
    } catch (err: any) {
      console.error('Export error:', err);
      showNotification('Failed to export HQ Wise Brand: ' + (err?.message || 'Unknown error'), 'info');
    } finally {
      setIsExportingHqWiseBrand(false);
    }
  };

  const handleReset = () => {
    setSalesRawFile(null);
    setSalesFileName('');
    setChemistRawFile(null);
    setChemistFileName('');
    setLastMonthRawFile(null);
    setLastMonthFileName('');
    setLastMonthValidation(undefined);
    setSelectedLastMonthSheet('');
    setRawLastMonthCustomerRecords([]);
    setRawLastMonthSalesRecords([]);
    setIsCompareMode(false);
    setRawSalesRecords([]);
    setRawCustomerRecords([]);
    setEnrichedRecords([]);
    setEnrichedCustomerRecords([]);
    setEnrichedLastMonthSalesRecords([]);
    setChemistMap(new Map());
    setChemistList([]);
    setDateHeader('');
    setSalesValidation(undefined);
    setChemistValidation(undefined);
    setHasReportGenerated(false);
    showNotification('Workbench reset. You can select fresh Excel files.', 'info');
  };

  const hasData = hasReportGenerated && enrichedRecords.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        dateHeader={dateHeader}
        hasData={hasData}
        onExportConsolidated={handleExportConsolidated}
        onExportPivot={handleExportPivot}
        isExportingConsolidated={isExportingConsolidated}
        isExportingPivot={isExportingPivot}
        onReset={handleReset}
        matchedCount={matchedCount}
        totalRecords={enrichedRecords.length}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 w-full">
        
        {/* Upload Cards & Generate Button */}
        <FileUploadCards
          salesFileName={salesFileName}
          chemistFileName={chemistFileName}
          lastMonthFileName={lastMonthFileName}
          salesValidation={salesValidation}
          chemistValidation={chemistValidation}
          lastMonthValidation={lastMonthValidation}
          isCompareMode={isCompareMode}
          onToggleCompareMode={setIsCompareMode}
          isLoading={isLoading}
          onUploadSalesFile={handleUploadSalesFile}
          onUploadChemistFile={handleUploadChemistFile}
          onUploadLastMonthFile={handleUploadLastMonthFile}
          onGenerateReport={handleGenerateReport}
          hasReportGenerated={hasReportGenerated}
        />

        {/* Validation Warnings & Alerts */}
        <ValidationAlerts
          salesValidation={salesValidation}
          chemistValidation={chemistValidation}
          lastMonthValidation={lastMonthValidation}
          isCompareMode={isCompareMode}
          unmatchedCount={unmatchedCount}
          unmatchedCodes={unmatchedCodes}
          onSelectSalesSheet={handleSelectSalesSheet}
          onSelectChemistSheet={handleSelectChemistSheet}
          onSelectLastMonthSheet={handleSelectLastMonthSheet}
        />

        {/* Generated Report Output Section */}
        {hasData && (
          <div id="report-output-section" className="space-y-6 mt-6">
            
            {/* Export Toolbar */}
            <ExportToolbar
              salesRecords={enrichedRecords}
              pivotData={pivotData}
              dateHeader={dateHeader}
              onExportConsolidated={handleExportConsolidated}
              onExportPivot={handleExportPivot}
              isExportingConsolidated={isExportingConsolidated}
              isExportingPivot={isExportingPivot}
              isCompareMode={isCompareMode}
            />

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto">
              <button
                id="tab-pivot-report"
                onClick={() => setActiveTab('pivot')}
                className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'pivot'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>SALES REPORT PIVOT</span>
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  {language === 'bn' ? 'লাখে (১.০০ = ১ লাখ)' : 'In Lac (1.00 = 100k)'}
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                  {pivotData.flmGroups.length} {language === 'bn' ? 'টি FLM' : 'FLMs'}
                </span>
              </button>

              {/* Current Month vs Last Month (MoM) */}
              {isCompareMode && enrichedCustomerRecords.some((r) => r.SALES_VALUE_LAST !== undefined) && (
                <button
                  id="tab-current-vs-last-month"
                  onClick={() => setActiveTab('compare')}
                  className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'compare'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-t-2 border-t-rose-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-rose-500" />
                  <span>Current Month vs Last Month</span>
                  <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                    {language === 'bn' ? 'নতুন শিট' : 'New Sheet'}
                  </span>
                </button>
              )}

              {/* HQ Wise Brand Tab */}
              <button
                id="tab-hq-wise-brand"
                onClick={() => setActiveTab('hq-brand')}
                className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'hq-brand'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-t-2 border-t-amber-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-500" />
                <span>HQ WISE BRAND</span>
                <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  {hqWiseBrandData.items.length} {language === 'bn' ? 'টি রো' : 'Rows'}
                </span>
              </button>

              <button
                id="tab-enriched-data"
                onClick={() => setActiveTab('enriched')}
                className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'enriched'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 border-t-2 border-t-teal-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t.enrichedDataTitle}</span>
                <span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                  {isCompareMode ? (language === 'bn' ? 'শীট ৪ ও শীট ২ (তুলনামূলক)' : 'Sheet 4 & Sheet 2 (Compared)') : (language === 'bn' ? 'শীট ৪ (P ও Q) এবং শীট ২ (K ও L)' : 'Sheet 4 (P & Q) & Sheet 2 (K & L)')}
                </span>
              </button>

              <button
                id="tab-visual-charts"
                onClick={() => setActiveTab('charts')}
                className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'charts'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-t-indigo-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{t.analyticsTitle}</span>
              </button>

              {chemistList.length > 0 && (
                <button
                  id="tab-chemist-master"
                  onClick={() => setActiveTab('chemist')}
                  className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'chemist'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-t-emerald-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{language === 'bn' ? `কেমিস্ট ডাটাবেস (${chemistList.length})` : `Chemist Database (${chemistList.length})`}</span>
                </button>
              )}
            </div>

            {/* Active Tab View */}
            <div>
              {activeTab === 'pivot' && (
                <PivotTableView
                  pivotData={pivotData}
                  dateHeader={dateHeader}
                  onExportPivot={handleExportPivot}
                  onExportConsolidated={handleExportConsolidated}
                  isExportingPivot={isExportingPivot}
                  isExportingConsolidated={isExportingConsolidated}
                />
              )}

              {activeTab === 'compare' && (
                <CurrentVsLastMonthView
                  customerRecords={enrichedCustomerRecords}
                  dateHeader={dateHeader}
                  onExportConsolidated={handleExportConsolidated}
                  isExportingConsolidated={isExportingConsolidated}
                />
              )}

              {activeTab === 'hq-brand' && (
                <HqWiseBrandView
                  data={hqWiseBrandData}
                  dateHeader={dateHeader}
                  onExportConsolidated={handleExportConsolidated}
                  onExportHqWiseBrand={handleExportHqWiseBrand}
                  isExportingHqWiseBrand={isExportingHqWiseBrand}
                  language={language}
                />
              )}

              {activeTab === 'enriched' && (
                <EnrichedDataView
                  records={enrichedRecords}
                  customerRecords={enrichedCustomerRecords}
                  dateHeader={dateHeader}
                  isCompareMode={isCompareMode}
                  onExportConsolidated={handleExportConsolidated}
                  isExportingConsolidated={isExportingConsolidated}
                />
              )}

              {activeTab === 'charts' && (
                <AnalyticsCharts pivotData={pivotData} />
              )}

              {activeTab === 'chemist' && (
                <ChemistMasterView
                  chemistList={chemistList}
                  sheetName={selectedChemistSheet || 'DHK-MYN-KH'}
                />
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer & Declaration */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 text-center max-w-5xl mx-auto">
            {t.declaration}
          </p>
        </div>
      </footer>

      {/* Floating Designed By Salim Badge & Interactive Profile Card */}
      <SalimProfileCard />

    </div>
  );
}
