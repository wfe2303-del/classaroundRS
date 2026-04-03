import { DEFAULT_COACHES, STORAGE_KEY } from './config.js';
import { cloneJson } from './utils.js';

const defaultState = {
  user: null,
  accessToken: '',
  sheetCatalog: [],
  authorized: false,
  activeCoachId: DEFAULT_COACHES[0]?.id || null,
  coaches: cloneJson(DEFAULT_COACHES).map((coach) => ({
    ...coach,
    payers: null,
    applicants: null,
    results: null,
  })),
};

function reviveCoach(coach) {
  return {
    id: coach.id,
    name: coach.name,
    payerSheetId: coach.payerSheetId || null,
    payerSheetTitle: coach.payerSheetTitle || '',
    payers: coach.payers || null,
    applicants: coach.applicants || null,
    results: coach.results || null,
  };
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      activeCoachId: parsed.activeCoachId || defaultState.activeCoachId,
      coaches: Array.isArray(parsed.coaches) && parsed.coaches.length
        ? parsed.coaches.map(reviveCoach)
        : defaultState.coaches,
    };
  } catch {
    return null;
  }
}

export const appState = loadStored() || defaultState;

export function persistState() {
  const storable = {
    activeCoachId: appState.activeCoachId,
    coaches: appState.coaches.map(({ id, name, payerSheetId, payerSheetTitle, payers, applicants, results }) => ({
      id, name, payerSheetId, payerSheetTitle, payers, applicants, results,
    })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storable));
}

export function resetVolatileAuth() {
  appState.user = null;
  appState.accessToken = '';
  appState.sheetCatalog = [];
  appState.authorized = false;
}

export function activeCoach() {
  return appState.coaches.find((coach) => coach.id === appState.activeCoachId) || null;
}
