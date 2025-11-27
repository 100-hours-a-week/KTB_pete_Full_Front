import { showToast } from "./utils.js";

const ACCESS_TOKEN_KEY = "accessToken";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getAccessToken();
}

// 페이지 전체가 “로그인 필수”인 경우 상단에서 호출
export function requirePageAuth() {
  if (!isLoggedIn()) {
    showToast("로그인이 필요합니다.");
    window.location.href = "./login.html";
    return false;
  }
  return true;
}

// 버튼 클릭 같은 개별 액션에서 사용하는 가드
export function ensureActionAuth() {
  if (!isLoggedIn()) {
    showToast("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
    return false;
  }
  return true;
}

// 공통 에러 처리 (특히 401)
export function handleAuthError(err, options = {}) {
  const { fallbackMessage } = options;
  const code = err?.code ?? err?.status;

  if (code === 401) {
    showToast("로그인이 만료되었거나 유효하지 않습니다. 다시 로그인 해주세요.");
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.location.href = "./login.html";
    return true; // 내가 처리했다
  }

  // 그 외 공통 에러 메시지 (페이지에서 커스터마이징)
  if (fallbackMessage) {
    showToast(fallbackMessage);
    return true;
  }

  return false;
}
