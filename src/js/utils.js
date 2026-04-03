export const $ = (id) => document.getElementById(id);

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

export function colToIdx(letter) {
  let n = 0;
  const up = String(letter).toUpperCase();
  for (let i = 0; i < up.length; i += 1) n = n * 26 + (up.charCodeAt(i) - 64);
  return n - 1;
}

export function normalizePhone(v) {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'number' ? String(Math.trunc(v)) : String(v).trim();
  if (!s) return '';
  if (/[eE]/.test(s) && /^[\d.+-]+[eE][+-]?\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) s = String(Math.trunc(n));
  }
  let digits = s.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('82')) {
    digits = digits.slice(2);
    if (!digits.startsWith('0')) digits = `0${digits}`;
  }
  if (digits.length === 10 && digits.startsWith('10')) digits = `0${digits}`;
  return digits;
}

export function parseAmount(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).trim().replace(/[^\d.-]/g, '');
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatKRW(n) {
  return `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
}

export async function readWorkbookGrid(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'csv') {
    const text = await file.text();
    const wb = XLSX.read(text, { type: 'string' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
}

export function parseJwtCredential(credential) {
  try {
    const payload = credential.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(normalized).split('').map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`).join(''));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function uid() {
  return crypto.randomUUID();
}

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
