export const APP_TITLE = '정산 매칭 대시보드';
export const STORAGE_KEY = 'rs-modular-google-v1';

export const GOOGLE_CLIENT_ID = '18228268359-iifm4ck3j9kqj74eh1p90tco1k2mbpi0.apps.googleusercontent.com';
export const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

export const PAYERS_SOURCE = {
  spreadsheetId: '1qclrbo3_VG-sSNIqMW4j1juzwP3nq_ZaT-y1z6WLafc',
  defaultSheetId: 1243994268,
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1qclrbo3_VG-sSNIqMW4j1juzwP3nq_ZaT-y1z6WLafc/edit?gid=1243994268#gid=1243994268',
};

export const DEFAULT_COACHES = [
  { id: crypto.randomUUID(), name: '강사', payerSheetId: PAYERS_SOURCE.defaultSheetId, payerSheetTitle: '' },
];

export const PAYERS_RULES = {
  nameCol: 'A',
  phoneCol: 'D',
  amountCol: 'L',
  startRow: 2,
  excludeZeroAmount: true,
};

export const APPLICANTS_RULES = {
  mediaCol: 'D',
  nameCol: 'F',
  phoneCol: 'G',
  startRow: 2,
};

export const PALETTE = [
  '#2563eb', '#16a34a', '#f97316', '#a855f7', '#06b6d4',
  '#eab308', '#db2777', '#64748b', '#0ea5e9', '#84cc16'
];

export const OTHER_COLOR = '#b91c1c';
