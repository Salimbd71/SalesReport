export type Language = 'en' | 'bn';
export type Theme = 'light' | 'dark';

export interface Translations {
  // App Header
  appTitle: string;
  reportDate: string;
  currentPeriod: string;
  vlookupMatched: string;
  rows: string;
  pivotReportBtn: string;
  consolidatedBtn: string;
  exporting: string;
  reset: string;
  themeToggleLight: string;
  themeToggleDark: string;
  langToggle: string;

  // Upload Section
  compareModeTitle: string;
  compareModeDesc: string;
  active: string;
  on: string;
  off: string;
  currentMonthSalesTitle: string;
  currentMonthSalesSubtitle: string;
  chemistMasterTitle: string;
  chemistMasterSubtitle: string;
  chemistMasterDesc: string;
  lastMonthSalesTitle: string;
  lastMonthSalesSubtitle: string;
  selectCurrentSalesBtn: string;
  selectChemistMasterBtn: string;
  selectLastMonthSalesBtn: string;
  dragDropHint: string;
  changeFile: string;
  chemists: string;
  customerRows: string;
  input1: string;
  masterMapping: string;
  prevMonth: string;

  // Ready & Generate Action
  readyToGenerate: string;
  uploadRequiredFiles: string;
  generateReportBtn: string;
  processingVlookup: string;

  // Export Toolbar
  readyForExport: string;
  generatedWorkbooksTitle: string;
  exportDesc: string;
  totalSalesValue: string;
  totalRecords: string;
  flmManagers: string;
  activeBrands: string;
  downloadConsolidatedTitle: string;
  downloadConsolidatedSub: string;
  downloadPivotTitle: string;
  downloadPivotSub: string;
  generatingFile: string;

  // Tabs
  tabPivot: string;
  tabEnriched: string;
  tabCharts: string;
  tabChemist: string;
  inLacBadge: string;
  flms: string;
  comparedBadge: string;

  // Pivot Table View
  pivotTableTitle: string;
  searchFlmHqBrand: string;
  expandAll: string;
  collapseAll: string;
  sortBySales: string;
  sortDefault: string;
  formatLac: string;
  formatBdt: string;
  formatRaw: string;
  exportPivotExcel: string;
  exportingPivot: string;
  exportConsolidatedExcel: string;
  exportingConsolidated: string;
  flmHeader: string;
  hqHeader: string;
  totalHeader: string;
  grandTotal: string;
  subtotal: string;
  noMatchingRecords: string;

  // Enriched Data View
  enrichedDataTitle: string;
  enrichedDataDesc: string;
  searchPlaceholder: string;
  searchChemistPlaceholder: string;
  sheet4Tab: string;
  sheet2Tab: string;
  allBrands: string;
  allFlms: string;
  allRecords: string;
  allMatchStatus: string;
  matchedOnly: string;
  unmatchedOnly: string;
  matchedInChemist: string;
  matchedStatus: string;
  unmatchedStatus: string;
  allSales: string;
  deficitOnly: string;
  growthOnly: string;
  lastOnly: string;
  currentOnly: string;
  lastMonthOnly: string;
  currentMonthOnly: string;
  deficitChemistCount: string;
  noRecordsMatching: string;
  noRecordsSheet2: string;
  showing: string;
  of: string;
  recordsText: string;
  colCustCode: string;
  colChemistName: string;
  colHqName: string;
  colBrand: string;
  colItemName: string;
  colSalesQty: string;
  colSalesValue: string;
  colFlmP: string;
  colHqQ: string;
  colFlmK: string;
  colHqL: string;
  colCurrentSales: string;
  colLastSales: string;
  colDeficit: string;
  colStatus: string;
  matched: string;
  unmatched: string;
  page: string;

  // Visual Analytics
  analyticsTitle: string;
  flmSalesChart: string;
  brandSalesChart: string;
  topFlmSales: string;
  topBrandContribution: string;
  salesDistribution: string;

  // Chemist Master View
  chemistMasterHeading: string;
  searchChemist: string;
  totalChemists: string;
  colSl: string;
  colMhlCode: string;
  colDepot: string;
  colRsm: string;

  // Validation Alerts
  validationTitle: string;
  validationWarning: string;
  missingCols: string;
  sheetSelector: string;
  unmatchedWarning: string;
  viewUnmatchedCodes: string;
  hideUnmatchedCodes: string;

  // Notifications & Footer
  salesLoaded: string;
  chemistLoaded: string;
  lastMonthLoaded: string;
  reportGeneratedSuccess: string;
  downloadSuccess: string;
  workbenchReset: string;
  designedBy: string;
  declaration: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Excel Sales Data Processing & Pivot Generator',
    reportDate: 'Report Date:',
    currentPeriod: 'Current Period',
    vlookupMatched: 'VLOOKUP Matched:',
    rows: 'rows',
    pivotReportBtn: 'Pivot Report (.xlsx)',
    consolidatedBtn: 'Consolidated (.xlsx)',
    exporting: 'Exporting...',
    reset: 'Reset',
    themeToggleLight: 'Light Mode',
    themeToggleDark: 'Dark Mode',
    langToggle: 'বাংলা',

    compareModeTitle: 'Last Month Sales Comparison',
    compareModeDesc: 'Enable to compare current & last month customer sales with deficit analysis',
    active: 'Active',
    on: 'ON',
    off: 'OFF',
    currentMonthSalesTitle: '1. Current Month Sales File',
    currentMonthSalesSubtitle: 'Upload Sun Mail Data Centrebd sales report file',
    chemistMasterTitle: '2. Chemist Master File',
    chemistMasterSubtitle: 'Upload assigned Chemist Master file from RSM Sir',
    chemistMasterDesc: 'Reference master list used for VLOOKUP mapping into Sales data',
    lastMonthSalesTitle: '3. Last Month Sales File',
    lastMonthSalesSubtitle: 'Upload last month sales report (HQ-Customer Sales)',
    selectCurrentSalesBtn: 'Select Current Sales File (.xlsx, .xls)',
    selectChemistMasterBtn: 'Select Chemist Master (.xlsx, .xls)',
    selectLastMonthSalesBtn: 'Select Last Month Sales (.xlsx, .xls)',
    dragDropHint: 'Drag & Drop or Click to browse',
    changeFile: 'Change',
    chemists: 'chemists',
    customerRows: 'customer rows',
    input1: 'Input File 1',
    masterMapping: 'Master Mapping',
    prevMonth: 'Previous Month',

    readyToGenerate: 'Ready to Generate',
    uploadRequiredFiles: 'Upload required files above to generate report',
    generateReportBtn: 'Generate Sales Report',
    processingVlookup: 'Processing VLOOKUP & Generating Pivot...',

    readyForExport: 'Ready for Export & Download',
    generatedWorkbooksTitle: 'Generated Output Workbooks',
    exportDesc: 'Download your consolidated files with preserved A1 date headers, auto-mapped Column P (FLM), Column Q (HQ), and multi-dimensional Pivot Table report.',
    totalSalesValue: 'Total Sales Value',
    totalRecords: 'Total Records',
    flmManagers: 'FLM Managers',
    activeBrands: 'Active Brands',
    downloadConsolidatedTitle: 'Consolidated File.xlsx',
    downloadConsolidatedSub: 'Sheets: SALES REPORT PIVOT, Current Month vs Last Month, HQ-Customer Sales, HQ-Customer-Product Sales',
    downloadPivotTitle: 'SALES REPORT PIVOT.xlsx',
    downloadPivotSub: 'Pre-formatted Lac (100k) view with FLM & Brand totals',
    generatingFile: 'Generating File...',

    tabPivot: 'SALES REPORT PIVOT',
    tabEnriched: 'Enriched Sales Data Tables',
    tabCharts: 'Visual Analytics',
    tabChemist: 'Chemist Database',
    inLacBadge: 'In Lac (1.00 = 100k)',
    flms: 'FLMs',
    comparedBadge: 'Sheet 4 & Sheet 2 (Compared)',

    pivotTableTitle: 'SALES REPORT PIVOT TABLE',
    searchFlmHqBrand: 'Search FLM, HQ, Brand...',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    sortBySales: 'Sorted by Sales',
    sortDefault: 'Sort: Default',
    formatLac: 'In Lac (1.00 = 100k)',
    formatBdt: '৳ BDT',
    formatRaw: 'Raw Num',
    exportPivotExcel: 'Export SALES REPORT PIVOT.xlsx',
    exportingPivot: 'Exporting Pivot...',
    exportConsolidatedExcel: 'Export Consolidated File.xlsx',
    exportingConsolidated: 'Exporting Consolidated...',
    flmHeader: 'FLM / Field Manager',
    hqHeader: 'HQ / Territory',
    totalHeader: 'Total Sales',
    grandTotal: 'Grand Total',
    subtotal: 'Subtotal',
    noMatchingRecords: 'No matching records found.',

    enrichedDataTitle: 'Enriched Sales Data Tables',
    enrichedDataDesc: 'View and filter processed data with Columns P (FLM) & Q (HQ) in Sheet 4, and Sheet 2 Customer-level comparison.',
    searchPlaceholder: 'Search by Chemist Name, Code, FLM, HQ or Brand...',
    searchChemistPlaceholder: 'Search Chemist, Code, FLM, HQ...',
    sheet4Tab: 'Sheet 4 (Product Sales)',
    sheet2Tab: 'Sheet 2 (Customer Sales)',
    allBrands: 'All Brands',
    allFlms: 'All FLMs',
    allRecords: 'All Records',
    allMatchStatus: 'All Match Status',
    matchedOnly: 'Matched Only',
    unmatchedOnly: 'Unmatched Only',
    matchedInChemist: 'Matched in Chemist',
    matchedStatus: 'Matched',
    unmatchedStatus: 'Unmatched',
    allSales: 'All Sales',
    deficitOnly: 'Deficit Only (< 0)',
    growthOnly: 'Growth Only (> 0)',
    lastOnly: 'Last Month Only',
    currentOnly: 'Current Month Only',
    lastMonthOnly: 'Last Month Only',
    currentMonthOnly: 'Current Month Only',
    deficitChemistCount: 'Deficit Chemists:',
    noRecordsMatching: 'No records matching your search / filter criteria.',
    noRecordsSheet2: 'No customer sales records matching your criteria.',
    showing: 'Showing',
    of: 'of',
    recordsText: 'records',
    colCustCode: 'Cust Code',
    colChemistName: 'Chemist Name',
    colHqName: 'HQ Name',
    colBrand: 'Brand',
    colItemName: 'Item Name',
    colSalesQty: 'Sales Qty',
    colSalesValue: 'Sales Value (৳)',
    colFlmP: 'FLM (Col P)',
    colHqQ: 'HQ (Col Q)',
    colFlmK: 'FLM (Col K)',
    colHqL: 'HQ (Col L)',
    colCurrentSales: 'Current Sales (৳)',
    colLastSales: 'Last Month Sales (৳)',
    colDeficit: 'Deficit / Diff (৳)',
    colStatus: 'Status',
    matched: 'Matched',
    unmatched: 'Unmatched',
    page: 'Page',

    analyticsTitle: 'Sales Performance & Distribution Analytics',
    flmSalesChart: 'FLM Sales Contribution (in Lac)',
    brandSalesChart: 'Brand Wise Sales Distribution',
    topFlmSales: 'Top FLM Sales Contribution',
    topBrandContribution: 'Top Brand Sales Performance',
    salesDistribution: 'Territory Distribution',

    chemistMasterHeading: 'Chemist Master Directory',
    searchChemist: 'Search chemist by code, name, address, FLM or HQ...',
    totalChemists: 'Total Chemists',
    colSl: 'Sl No',
    colMhlCode: 'MHL Code',
    colDepot: 'Depot',
    colRsm: 'RSM',

    validationTitle: 'File Verification & Structure Alerts',
    validationWarning: 'Validation Notices Found',
    missingCols: 'Missing Columns:',
    sheetSelector: 'Select Sheet:',
    unmatchedWarning: 'Unmatched Chemist Codes Detected',
    viewUnmatchedCodes: 'View Unmatched Codes',
    hideUnmatchedCodes: 'Hide Unmatched Codes',

    salesLoaded: 'Sales Data loaded successfully',
    chemistLoaded: 'Chemist List loaded successfully',
    lastMonthLoaded: 'Last Month Sales loaded successfully',
    reportGeneratedSuccess: 'Sales Report generated successfully!',
    downloadSuccess: 'File downloaded successfully:',
    workbenchReset: 'Workbench reset. You can select fresh Excel files.',
    designedBy: 'Designed By Salim',
    declaration: 'Declaration: This web application is an entirely unofficial, independently developed tool and is not affiliated with, endorsed by, or officially supported by Sun Pharma. However, the data files processed or used within this application are official Sun Pharma files. This application is strictly intended for use by authorized Sun Pharma employees only. The website link, application, software, or data processed through it must not be shared, distributed, forwarded, or made accessible to anyone outside Sun Pharma. By using this application, users acknowledge and agree to comply with all confidentiality, security, and authorized-use requirements applicable to the official data and files.',
  },
  bn: {
    appTitle: 'এক্সেল সেলস ডেটা প্রসেসিং ও পিভট জেনারেটর',
    reportDate: 'রিপোর্টের তারিখ:',
    currentPeriod: 'বর্তমান সময়কাল',
    vlookupMatched: 'ম্যাচিং সম্পন্ন:',
    rows: 'টি সারি',
    pivotReportBtn: 'পিভট রিপোর্ট (.xlsx)',
    consolidatedBtn: 'কনসলিডেটেড (.xlsx)',
    exporting: 'ডাউনলোড হচ্ছে...',
    reset: 'রিসেট',
    themeToggleLight: 'লাইট মোড',
    themeToggleDark: 'ডার্ক মোড',
    langToggle: 'English',

    compareModeTitle: 'বিগত মাসের সেলস তুলনা',
    compareModeDesc: 'বর্তমান ও বিগত মাসের কাস্টমার সেলস তুলনা এবং ঘাটতি (Deficit) বিশ্লেষণের জন্য চালু করুন',
    active: 'চালু',
    on: 'চালু',
    off: 'বন্ধ',
    currentMonthSalesTitle: '১. চলতি মাসের সেলস ফাইল',
    currentMonthSalesSubtitle: 'Sun Mail এর Data Centrebd সেলস রিপোর্ট ফাইল আপলোড করুন',
    chemistMasterTitle: '২. কেমিস্ট মাস্টার ফাইল',
    chemistMasterSubtitle: 'RSM স্যারের দেওয়া নির্দিষ্ট কেমিস্ট মাস্টার ফাইল আপলোড করুন',
    chemistMasterDesc: 'সেলস ডেটার সাথে VLOOKUP ম্যাপিংয়ের জন্য ব্যবহৃত রেফারেন্স মাস্টার তালিকা',
    lastMonthSalesTitle: '৩. গত মাসের সেলস ফাইল',
    lastMonthSalesSubtitle: 'গত মাসের সেলস রিপোর্ট ফাইল আপলোড করুন (HQ-Customer Sales)',
    selectCurrentSalesBtn: 'চলতি মাসের সেলস ফাইল নির্বাচন করুন (.xlsx, .xls)',
    selectChemistMasterBtn: 'কেমিস্ট মাস্টার ফাইল নির্বাচন করুন (.xlsx, .xls)',
    selectLastMonthSalesBtn: 'গত মাসের সেলস ফাইল নির্বাচন করুন (.xlsx, .xls)',
    dragDropHint: 'ড্র্যাগ ও ড্রপ করুন অথবা ক্লিক করে ফাইল নির্বাচন করুন',
    changeFile: 'পরিবর্তন',
    chemists: 'জন কেমিস্ট',
    customerRows: 'টি কাস্টমার সারি',
    input1: 'ইনপুট ফাইল ১',
    masterMapping: 'মাস্টার ম্যাপিং',
    prevMonth: 'বিগত মাস',

    readyToGenerate: 'রিপোর্ট তৈরির জন্য প্রস্তুত',
    uploadRequiredFiles: 'রিপোর্ট তৈরি করতে উপরের ফাইলগুলো আপলোড করুন',
    generateReportBtn: 'সেলস রিপোর্ট তৈরি করুন',
    processingVlookup: 'ভি-লুকআপ ও পিভট তৈরি হচ্ছে...',

    readyForExport: 'এক্সপোর্ট ও ডাউনলোডের জন্য প্রস্তুত',
    generatedWorkbooksTitle: 'তৈরিকৃত এক্সেল ফাইলসমূহ',
    exportDesc: 'সংরক্ষিত A1 তারিখ, স্বয়ংক্রিয় ম্যাপিংকৃত কলাম P (FLM), কলাম Q (HQ) এবং বহু-মাত্রিক পিভট টেবিল রিপোর্ট ডাউনলোড করুন।',
    totalSalesValue: 'মোট বিক্রয় মূল্য',
    totalRecords: 'মোট রেকর্ড',
    flmManagers: 'এফএলএম ম্যানেজার',
    activeBrands: 'সক্রিয় ব্র্যান্ড',
    downloadConsolidatedTitle: 'কনসলিডেটেড ফাইল.xlsx',
    downloadConsolidatedSub: 'শীট ক্রম: SALES REPORT PIVOT, Current Month vs Last Month, HQ-Customer Sales, HQ-Customer-Product Sales',
    downloadPivotTitle: 'সেলস রিপোর্ট পিভট.xlsx',
    downloadPivotSub: 'এফএলএম ও ব্র্যান্ড টোটালসহ প্রি-ফরম্যাটেড লাখ ভিউ (১.০০ = ১ লাখ)',
    generatingFile: 'ফাইল প্রস্তুত হচ্ছে...',

    tabPivot: 'সেলস রিপোর্ট পিভট',
    tabEnriched: 'সমৃদ্ধ সেলস ডেটা টেবিল',
    tabCharts: 'ভিজ্যুয়াল অ্যানালিটিক্স',
    tabChemist: 'কেমিস্ট ডেটাবেস',
    inLacBadge: 'লাখে (১.০০ = ১ লাখ)',
    flms: 'জন এফএলএম',
    comparedBadge: 'শীট ৪ ও শীট ২ (তুলনাকৃত)',

    pivotTableTitle: 'সেলস রিপোর্ট পিভট টেবিল',
    searchFlmHqBrand: 'FLM, HQ অথবা Brand খুঁজুন...',
    expandAll: 'সব খুলুন',
    collapseAll: 'সব বন্ধ করুন',
    sortBySales: 'সর্বোচ্চ সেলস অনুসারে',
    sortDefault: 'ডিফল্ট ক্রম',
    formatLac: 'লাখে (১.০০ = ১ লাখ)',
    formatBdt: '৳ টাকায়',
    formatRaw: 'সাধারণ সংখ্যা',
    exportPivotExcel: 'পিভট রিপোর্ট ডাউনলোড (.xlsx)',
    exportingPivot: 'পিভট ডাউনলোড হচ্ছে...',
    exportConsolidatedExcel: 'কনসলিডেটেড ফাইল ডাউনলোড (.xlsx)',
    exportingConsolidated: 'কনসলিডেটেড ডাউনলোড হচ্ছে...',
    flmHeader: 'এফএলএম ম্যানেজার',
    hqHeader: 'এইচকিউ / হেডকোয়ার্টার',
    totalHeader: 'মোট বিক্রয়',
    grandTotal: 'সর্বমোট',
    subtotal: 'উপ-মোট',
    noMatchingRecords: 'কোনো তথ্য পাওয়া যায়নি।',

    enrichedDataTitle: 'সমৃদ্ধ সেলস ডেটা টেবিল',
    enrichedDataDesc: 'শীট ৪-এ কলাম P (FLM) ও Q (HQ) এবং শীট ২-এ কাস্টমার পর্যায়ের বিগত মাসের তুলনামূলক ডেটা ও ঘাটতি (Deficit) দেখুন।',
    searchPlaceholder: 'কেমিস্টের নাম, কোড, FLM, HQ বা ব্র্যান্ড দিয়ে খুঁজুন...',
    searchChemistPlaceholder: 'কেমিস্ট, কোড, FLM, HQ দিয়ে খুঁজুন...',
    sheet4Tab: 'শীট ৪ (প্রোডাক্ট সেলস)',
    sheet2Tab: 'শীট ২ (কাস্টমার সেলস)',
    allBrands: 'সকল ব্র্যান্ড',
    allFlms: 'সকল FLM',
    allRecords: 'সকল রেকর্ড',
    allMatchStatus: 'সকল ম্যাচ স্ট্যাটাস',
    matchedOnly: 'শুধুমাত্র ম্যাচিংকৃত',
    unmatchedOnly: 'শুধুমাত্র অমিল কোড',
    matchedInChemist: 'কেমিস্টে পাওয়া গেছে',
    matchedStatus: 'ম্যাচড',
    unmatchedStatus: 'অনম্যাচড',
    allSales: 'সকল সেলস',
    deficitOnly: 'শুধুমাত্র ঘাটতি (< ০)',
    growthOnly: 'শুধুমাত্র প্রবৃদ্ধি (> ০)',
    lastOnly: 'শুধু গত মাসের',
    currentOnly: 'শুধু চলতি মাসের',
    lastMonthOnly: 'শুধু গত মাসের',
    currentMonthOnly: 'শুধু চলতি মাসের',
    deficitChemistCount: 'ঘাটতি কেমিস্ট সংখ্যা:',
    noRecordsMatching: 'আপনার খোঁজার সাথে মিল রেখে কোনো রেকর্ড পাওয়া যায়নি।',
    noRecordsSheet2: 'শীট ২ এর জন্য কোনো কাস্টমার রেকর্ড পাওয়া যায়নি।',
    showing: 'প্রদর্শন',
    of: 'মোট',
    recordsText: 'টি রেকর্ডের মধ্যে',
    colCustCode: 'কাস্টমার কোড',
    colChemistName: 'কেমিস্টের নাম',
    colHqName: 'এইচকিউ এর নাম',
    colBrand: 'ব্র্যান্ড',
    colItemName: 'আইটেমের নাম',
    colSalesQty: 'বিক্রয় পরিমাণ',
    colSalesValue: 'বিক্রয় মূল্য (৳)',
    colFlmP: 'FLM (Col P)',
    colHqQ: 'HQ (Col Q)',
    colFlmK: 'FLM (Col K)',
    colHqL: 'HQ (Col L)',
    colCurrentSales: 'চলতি মাসের সেলস (৳)',
    colLastSales: 'গত মাসের সেলস (৳)',
    colDeficit: 'ঘাটতি / পার্থক্য (৳)',
    colStatus: 'অবস্থা',
    matched: 'ম্যাচড',
    unmatched: 'অনম্যাচড',
    page: 'পৃষ্ঠা',

    analyticsTitle: 'সেলস পারফরম্যান্স ও বিশ্লেষণ',
    flmSalesChart: 'এফএলএম সেলস অবদান (লাখে)',
    brandSalesChart: 'ব্র্যান্ড ভিত্তিক সেলস বণ্টন',
    topFlmSales: 'শীর্ষ এফএলএম সেলস অবদান',
    topBrandContribution: 'শীর্ষ ব্র্যান্ড সেলস পারফরম্যান্স',
    salesDistribution: 'টেরিটরি ভিত্তিক বিশ্লেষণ',

    chemistMasterHeading: 'কেমিস্ট মাস্টার ডিরেক্টরি',
    searchChemist: 'কোড, নাম, ঠিকানা, FLM বা HQ দিয়ে খুঁজুন...',
    totalChemists: 'মোট কেমিস্ট',
    colSl: 'ক্রমিক',
    colMhlCode: 'এমএইচএল কোড',
    colDepot: 'ডিপো',
    colRsm: 'আরএসএম',

    validationTitle: 'ফাইল যাচাই ও স্ট্রাকচার সতর্কতা',
    validationWarning: 'যাচাই নোটিশ রয়েছে',
    missingCols: 'অনুপস্থিত কলামসমূহ:',
    sheetSelector: 'শীট নির্বাচন করুন:',
    unmatchedWarning: 'ম্যাচ না হওয়া কেমিস্ট কোড শনাক্ত হয়েছে',
    viewUnmatchedCodes: 'অনম্যাচড কোড তালিকা দেখুন',
    hideUnmatchedCodes: 'তালিকা লুকান',

    salesLoaded: 'সেলস ডেটা সফলভাবে লোড হয়েছে',
    chemistLoaded: 'কেমিস্ট তালিকা সফলভাবে লোড হয়েছে',
    lastMonthLoaded: 'গত মাসের সেলস ফাইল সফলভাবে লোড হয়েছে',
    reportGeneratedSuccess: 'সেলস রিপোর্ট ও পিভট সফলভাবে তৈরি হয়েছে!',
    downloadSuccess: 'ফাইল সফলভাবে ডাউনলোড হয়েছে:',
    workbenchReset: 'ওয়ার্কবেঞ্চ রিসেট হয়েছে। আপনি নতুন ফাইল আপলোড করতে পারেন।',
    designedBy: 'ডিজাইন করেছেন সেলিম',
    declaration: 'ঘোষণা: এই ওয়েব অ্যাপ্লিকেশনটি সম্পূর্ণ স্বাধীনভাবে প্রস্তুতকৃত একটি অনানুষ্ঠানিক টুল এবং এটি সান ফার্মার দাপ্তরিক অংশ নয়। তবে এই অ্যাপ্লিকেশনে ব্যবহৃত ডেটা ফাইলগুলো সান ফার্মার নিজস্ব। এটি শুধুমাত্র সান ফার্মার অনুমোদিত কর্মীদের ব্যবহারের জন্য প্রস্তুতকৃত। কোনোভাবেই এই ওয়েবসাইটের লিংক, সফটওয়্যার বা ডেটা সান ফার্মার বাইরের কারো সাথে শেয়ার করা যাবে না। অ্যাপ্লিকেশনটি ব্যবহারের মাধ্যমে ব্যবহারকারী অফিশিয়াল ডেটার গোপনীয়তা ও নিরাপত্তা বজায় রাখতে সম্মত হন।',
  },
};

