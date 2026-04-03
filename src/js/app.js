import { PAYERS_SOURCE } from './config.js';
import { initGoogleAuth, requestSheetsAccess, signOut } from './auth.js';
import { exportReportPng } from './exportReport.js';
import { computeResults, parseApplicants, parsePayersFromGrid } from './parsers.js';
import { renderAll } from './render.js';
import { fetchSheetCatalog, fetchSheetGrid } from './sheets.js';
import { activeCoach, appState, persistState, resetVolatileAuth } from './state.js';
import { $, readWorkbookGrid, uid } from './utils.js';

function setLoginStatus(message) {
  $('loginStatus').textContent = message || '';
}

async function refreshSheetCatalog() {
  if (!appState.accessToken) return;
  appState.sheetCatalog = await fetchSheetCatalog(appState.accessToken);

  appState.coaches.forEach((coach) => {
    const matched = appState.sheetCatalog.find((sheet) => String(sheet.sheetId) === String(coach.payerSheetId));
    if (matched) {
      coach.payerSheetTitle = matched.title;
      return;
    }

    if (appState.sheetCatalog[0]) {
      coach.payerSheetId = appState.sheetCatalog[0].sheetId;
      coach.payerSheetTitle = appState.sheetCatalog[0].title;
    }
  });

  persistState();
}

async function syncPayersForActiveCoach() {
  const coach = activeCoach();
  if (!coach) {
    alert('강사 탭을 먼저 확인해 주세요.');
    return;
  }
  if (!appState.accessToken) {
    alert('먼저 Google 로그인을 완료해 주세요.');
    return;
  }

  const selectedSheetId = $('sheetSelect').value;
  const selectedSheet = appState.sheetCatalog.find((sheet) => String(sheet.sheetId) === String(selectedSheetId));
  if (!selectedSheet) {
    alert('불러올 시트를 먼저 선택해 주세요.');
    return;
  }

  $('statusPill').textContent = '결제자 시트를 읽고 있습니다.';
  const grid = await fetchSheetGrid(appState.accessToken, selectedSheet.title);
  coach.payerSheetId = selectedSheet.sheetId;
  coach.payerSheetTitle = selectedSheet.title;
  coach.payers = parsePayersFromGrid(grid);
  coach.results = null;
  persistState();
  renderAll();
}

async function handleSignedIn({ user, accessToken }) {
  appState.user = user;
  appState.accessToken = accessToken;
  appState.authorized = true;
  setLoginStatus('');
  await refreshSheetCatalog();
  renderAll();
}

function handleSignedOut() {
  resetVolatileAuth();
  renderAll();
  setLoginStatus('로그아웃되었습니다.');
}

function bindEvents() {
  $('requestAccessBtn').addEventListener('click', () => {
    requestSheetsAccess(true, appState.user || null);
  });

  $('logoutBtn').addEventListener('click', () => {
    signOut(appState.accessToken, appState.user?.email || '');
  });

  $('syncPayersBtn').addEventListener('click', async () => {
    try {
      await syncPayersForActiveCoach();
    } catch (error) {
      console.error(error);
      alert(error.message || '결제자 시트를 불러오지 못했습니다.');
      renderAll();
    }
  });

  $('sheetSelect').addEventListener('change', (event) => {
    const coach = activeCoach();
    if (!coach) return;
    const selectedSheet = appState.sheetCatalog.find((sheet) => String(sheet.sheetId) === String(event.target.value));
    if (!selectedSheet) return;
    coach.payerSheetId = selectedSheet.sheetId;
    coach.payerSheetTitle = selectedSheet.title;
    coach.results = null;
    persistState();
    renderAll();
  });

  $('countMode').addEventListener('change', () => {
    const coach = activeCoach();
    if (!coach) return;
    coach.results = null;
    persistState();
    renderAll();
  });

  $('applicantsFile').addEventListener('change', async (event) => {
    const coach = activeCoach();
    const file = event.target.files?.[0];
    if (!coach || !file) return;

    try {
      const grid = await readWorkbookGrid(file);
      coach.applicants = parseApplicants(grid);
      coach.results = null;
      persistState();
      renderAll();
    } catch (error) {
      console.error(error);
      alert('신청자 파일을 읽지 못했습니다. 파일 형식을 확인해 주세요.');
    }
  });

  $('runBtn').addEventListener('click', () => {
    const coach = activeCoach();
    if (!coach?.payers) {
      alert('결제자 시트를 먼저 동기화해 주세요.');
      return;
    }
    if (!coach?.applicants) {
      alert('신청자 파일을 먼저 선택해 주세요.');
      return;
    }

    coach.results = computeResults(coach.payers, coach.applicants, $('countMode').value);
    persistState();
    renderAll();
  });

  $('addCoachBtn').addEventListener('click', () => {
    const name = prompt('추가하실 강사 탭 이름을 입력해 주세요.', `강사${appState.coaches.length + 1}`);
    if (!name) return;

    appState.coaches.push({
      id: uid(),
      name: name.trim(),
      payerSheetId: appState.sheetCatalog[0]?.sheetId || PAYERS_SOURCE.defaultSheetId,
      payerSheetTitle: appState.sheetCatalog[0]?.title || '',
      payers: null,
      applicants: null,
      results: null,
    });
    appState.activeCoachId = appState.coaches.at(-1)?.id || appState.activeCoachId;
    persistState();
    renderAll();
  });

  $('removeCoachBtn').addEventListener('click', () => {
    const coach = activeCoach();
    if (!coach) return;
    if (!confirm(`'${coach.name}' 탭을 삭제하시겠습니까?`)) return;

    appState.coaches = appState.coaches.filter((item) => item.id !== coach.id);
    appState.activeCoachId = appState.coaches[0]?.id || null;
    persistState();
    renderAll();
  });

  $('coachTabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-coach-id]');
    if (!button) return;
    appState.activeCoachId = button.dataset.coachId;
    persistState();
    renderAll();
  });

  $('exportBtn').addEventListener('click', () => {
    exportReportPng();
  });
}

async function bootstrap() {
  bindEvents();
  renderAll();

  try {
    await initGoogleAuth({
      loginContainer: $('googleLoginBtn'),
      onSignedIn: handleSignedIn,
      onStatusChange: setLoginStatus,
      onLogout: handleSignedOut,
    });
  } catch (error) {
    console.error(error);
    setLoginStatus(error.message || 'Google 로그인 준비 중 문제가 발생했습니다.');
  }
}

bootstrap();
