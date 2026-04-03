import { PALETTE, OTHER_COLOR } from './config.js';
import { activeCoach, appState } from './state.js';
import { drawDonut } from './charts.js';
import { $, esc, formatKRW } from './utils.js';

function colorMapForCoach() {
  const map = new Map();
  (activeCoach()?.applicants?.mediaList || []).forEach((item, index) => {
    map.set(item.name, PALETTE[index % PALETTE.length]);
  });
  map.set('기타(미매칭)', OTHER_COLOR);
  return map;
}

function getRowsForRendering() {
  const coach = activeCoach();
  if (!coach?.results) return [];
  const rows = [...coach.results.dashboard];
  rows.push({
    name: '기타(미매칭)',
    pay: coach.results.otherCount,
    tracking: null,
    rate: null,
    amount: coach.results.otherAmount,
    amountShare: coach.results.otherAmountShare,
    isOther: true,
  });
  return rows;
}

export function renderAuthUi() {
  const loggedIn = Boolean(appState.user && appState.accessToken);
  $('loginSection').classList.toggle('hidden', loggedIn);
  $('appSection').classList.toggle('hidden', !loggedIn);

  const userBadge = $('userBadge');
  userBadge.classList.toggle('hidden', !loggedIn);
  userBadge.textContent = loggedIn
    ? `${appState.user?.name || appState.user?.email || 'Google 사용자'} 님`
    : '';
}

export function renderSheetCatalog() {
  const select = $('sheetSelect');
  const coach = activeCoach();
  const catalog = appState.sheetCatalog || [];

  select.innerHTML = catalog.length
    ? catalog.map((sheet) => `<option value="${sheet.sheetId}">${esc(sheet.title)}</option>`).join('')
    : '<option value="">시트 없음</option>';

  if (coach?.payerSheetId) select.value = String(coach.payerSheetId);
  if (!select.value && catalog[0]) select.value = String(catalog[0].sheetId);
}

export function renderCoachTabs() {
  const wrap = $('coachTabs');
  wrap.innerHTML = '';
  appState.coaches.forEach((coach) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tab${coach.id === appState.activeCoachId ? ' active' : ''}`;
    button.textContent = coach.name;
    button.dataset.coachId = coach.id;
    wrap.appendChild(button);
  });
}

export function renderStatus() {
  const coach = activeCoach();
  if (!coach) {
    $('statusPill').textContent = '강사 탭이 없습니다.';
    return;
  }

  const currentSheet = appState.sheetCatalog.find((sheet) => String(sheet.sheetId) === String(coach.payerSheetId));
  const status = [
    coach.payers ? `결제자 ${currentSheet?.title || coach.payerSheetTitle || '연결 완료'}` : '결제자 미선택',
    coach.applicants ? '신청자 준비 완료' : '신청자 미등록',
    coach.results ? '결과 준비 완료' : '결과 대기',
  ];
  $('statusPill').textContent = status.join(' · ');
}

export function renderMissingPhoneTable() {
  const coach = activeCoach();
  const rows = coach?.payers?.missingPhoneRows || [];
  $('missingPhoneBadge').textContent = coach?.payers ? `누락 ${rows.length.toLocaleString()}건` : '-';
  $('missingPhoneSumBadge').textContent = coach?.payers ? `합계 ${formatKRW(coach.payers.missingPhoneAmountSum || 0)}` : '-';

  if (!coach?.payers) {
    $('missingPhoneTbody').innerHTML = '<tr><td colspan="5" class="empty-row">결제자 시트를 선택해 주세요.</td></tr>';
    return;
  }

  if (!rows.length) {
    $('missingPhoneTbody').innerHTML = '<tr><td colspan="5" class="empty-row">누락된 전화번호가 없습니다.</td></tr>';
    return;
  }

  const limit = 500;
  $('missingPhoneTbody').innerHTML = rows.slice(0, limit).map((row, index) => `
    <tr>
      <td class="mono">${index + 1}</td>
      <td>${esc(row.name || '(이름 없음)')}</td>
      <td class="num">${formatKRW(row.amount || 0)}</td>
      <td class="mono">${esc(row.rawPhone || '')}</td>
      <td class="mono">${row.rowNo}</td>
    </tr>
  `).join('');
}

export function renderResults() {
  const coach = activeCoach();
  const rows = getRowsForRendering();
  const colors = colorMapForCoach();

  $('analysisTitle').textContent = coach ? `${coach.name} 분석표` : '분석표';
  $('donutTitle').textContent = coach ? `${coach.name} 결제 비중` : '결제 비중';

  if (!coach?.results) {
    $('summaryBadge').textContent = '대기';
    $('dashTbody').innerHTML = '<tr><td colspan="6" class="empty-row">매칭 실행 후 결과가 표시됩니다.</td></tr>';
    $('barsWrap').innerHTML = '';
    $('donutLegend').innerHTML = '';
    $('donutTotal').textContent = '-';
    drawDonut($('donutCanvas'), [], 0, colors);
    return;
  }

  const result = coach.results;
  $('summaryBadge').textContent = `결제 ${result.totalPayCount.toLocaleString()}건 · 총액 ${formatKRW(result.totalPayAmount)}`;
  $('donutTotal').textContent = formatKRW(result.totalPayAmount);

  $('dashTbody').innerHTML = rows.map((row) => {
    const conversion = row.rate == null ? '-' : `${(row.rate * 100).toFixed(1)}%`;
    const share = `${((row.amountShare || 0) * 100).toFixed(1)}%`;
    return `
      <tr>
        <td class="${row.isOther ? 'danger-text' : ''}">${esc(row.name)}</td>
        <td class="num">${(row.pay || 0).toLocaleString()}</td>
        <td class="num">${row.tracking == null ? '-' : row.tracking.toLocaleString()}</td>
        <td class="num">${conversion}</td>
        <td class="num">${formatKRW(row.amount || 0)}</td>
        <td class="num ${row.isOther ? 'danger-text' : ''}">${share}</td>
      </tr>
    `;
  }).join('');

  drawDonut($('donutCanvas'), rows.map((row) => ({ name: row.name, amount: row.amount || 0 })), result.totalPayAmount, colors);

  $('donutLegend').innerHTML = rows.map((row) => {
    const pct = result.totalPayAmount ? ((row.amount || 0) / result.totalPayAmount * 100).toFixed(1) : '0.0';
    return `
      <div class="legend-item">
        <span class="legend-swatch" style="background:${colors.get(row.name) || '#0f172a'}"></span>
        <span class="legend-name ${row.isOther ? 'danger-text' : ''}">${esc(row.name)}</span>
        <span class="legend-val">${formatKRW(row.amount || 0)} (${pct}%)</span>
      </div>
    `;
  }).join('');

  const maxAmount = Math.max(1, ...rows.map((row) => row.amount || 0));
  $('barsWrap').innerHTML = [...rows].sort((a, b) => (b.amount || 0) - (a.amount || 0)).map((row) => {
    const width = Math.max(2, Math.round(((row.amount || 0) / maxAmount) * 100));
    return `
      <div class="bar-row">
        <div class="bar-name ${row.isOther ? 'danger-text' : ''}">${esc(row.name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%;background:${colors.get(row.name) || '#0f172a'}"></div></div>
        <div class="bar-val ${row.isOther ? 'danger-text' : ''}">${formatKRW(row.amount || 0)}</div>
      </div>
    `;
  }).join('');
}

export function renderAll() {
  renderAuthUi();
  renderCoachTabs();
  renderSheetCatalog();
  renderStatus();
  renderResults();
  renderMissingPhoneTable();
}
