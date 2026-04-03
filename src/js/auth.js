import { GOOGLE_CLIENT_ID, GOOGLE_SHEETS_SCOPE } from './config.js';
import { parseJwtCredential } from './utils.js';

let tokenClient = null;
let onSignIn = () => {};
let onStatus = () => {};
let onSignedOut = () => {};

function waitForGoogleLibrary() {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (window.google?.accounts?.id && window.google?.accounts?.oauth2) {
        clearInterval(timer);
        resolve(window.google);
      }
      if (tries > 200) {
        clearInterval(timer);
        reject(new Error('Google 로그인 라이브러리를 불러오지 못했습니다.'));
      }
    }, 50);
  });
}

export async function initGoogleAuth({ loginContainer, onSignedIn, onStatusChange, onLogout }) {
  onSignIn = onSignedIn;
  onStatus = onStatusChange;
  onSignedOut = onLogout;

  const googleApi = await waitForGoogleLibrary();

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
    onStatus('Google Client ID를 먼저 입력해 주세요.');
    return;
  }

  googleApi.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false,
    ux_mode: 'popup',
  });

  googleApi.accounts.id.renderButton(loginContainer, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
    locale: 'ko',
  });

  tokenClient = googleApi.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_SHEETS_SCOPE,
    callback: handleTokenResponse,
    error_callback: (error) => {
      const msg = error?.type === 'popup_closed' ? '권한 요청 창이 닫혔습니다.' : '권한 요청 중 문제가 발생했습니다.';
      onStatus(msg);
    },
  });
}

function handleCredentialResponse(response) {
  const profile = parseJwtCredential(response.credential);
  if (!profile) {
    onStatus('로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.');
    return;
  }

  onStatus('시트 접근 권한을 확인하고 있습니다.');
  requestSheetsAccess(true, profile);
}

function handleTokenResponse(tokenResponse) {
  if (tokenResponse?.error) {
    onStatus('시트 접근 권한을 승인하지 않으셨습니다.');
    return;
  }

  const user = tokenResponse._userProfile || null;
  onStatus('');
  onSignIn({
    user,
    accessToken: tokenResponse.access_token,
    grantedScopes: tokenResponse.scope || '',
  });
}

export function requestSheetsAccess(promptConsent = false, profile = null) {
  if (!tokenClient) {
    onStatus('Google 인증이 아직 준비되지 않았습니다.');
    return;
  }

  tokenClient.callback = (tokenResponse) => {
    if (tokenResponse?.error) {
      onStatus('시트 권한 승인이 완료되지 않았습니다.');
      return;
    }

    onStatus('');
    onSignIn({
      user: profile,
      accessToken: tokenResponse.access_token,
      grantedScopes: tokenResponse.scope || '',
    });
  };

  tokenClient.requestAccessToken({
    prompt: promptConsent ? 'consent' : '',
  });
}

export function signOut(accessToken, userEmail = '') {
  if (!window.google?.accounts) return;

  try {
    window.google.accounts.id.disableAutoSelect();
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        if (userEmail) {
          window.google.accounts.id.revoke(userEmail, () => {
            onSignedOut();
          });
        } else {
          onSignedOut();
        }
      });
      return;
    }

    if (userEmail) {
      window.google.accounts.id.revoke(userEmail, () => {
        onSignedOut();
      });
      return;
    }
  } catch {
    // no-op
  }

  onSignedOut();
}
