// api-fetch.js
export const API_BASE_URL = "http://localhost:8080";

// Access Token 로컬 저장 키 (auth.js와 반드시 동일하게 유지)
const ACCESS_TOKEN_KEY = "accessToken";

// 로그인 페이지 경로
const LOGIN_PAGE_PATH = "./login.html";

/**
 * 이미지 URL 보정 유틸 (기존 로직 유지)
 */
export function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return API_BASE_URL + url;
  return `${API_BASE_URL}/${url}`;
}

/**
 * URL 조합 전담
 */
function buildUrl(path) {
  const isAbsolute =
    path.startsWith("http://") || path.startsWith("https://");
  return isAbsolute ? path : API_BASE_URL + path;
}

/**
 * Access Token 헬퍼
 */
function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function setAccessToken(token) {
  if (!token) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearAccessTokenAndRedirect() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.location.href = LOGIN_PAGE_PATH;
}

/**
 * 헤더 구성 전담
 *  - FormData 여부에 따라 Content-Type 설정
 *  - includeAuth 가 true 이고 토큰이 있으면 Authorization 추가
 */
function buildHeaders(includeAuth, customHeaders, body) {
  const headers = { ...customHeaders };
  const isFormData = body instanceof FormData;

  // FormData가 아니고 body가 있으면 JSON으로 보냄
  if (!isFormData && body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // 토큰이 필요한 요청이라면 Authorization 헤더 추가
  if (includeAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * 응답 JSON 파싱 전담
 *  - JSON 파싱 실패 시 통일된 에러 형태로 throw
 */
async function parseJsonResponse(response) {
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    throw {
      message: "서버 응답 형식이 올바르지 않습니다.",
      status: response.status,
      code: response.status,
      raw: null,
    };
  }
}

/**
 * 에러 객체 포맷 통일
 */
function buildError(response, data) {
  const status = response.status;
  const code = data && data.code ? data.code : status;
  const message =
    (data && data.message) || "요청 실패. 잠시 후 다시 시도해주세요.";

  return {
    message,
    status,
    code,
    raw: data,
  };
}

// ------------------------------
// /auth/refresh 기반 Access Token 재발급
// ------------------------------
let isRefreshing = false;
let refreshWaitQueue = [];

/**
 * /auth/refresh 호출해서 Access Token 재발급
 * - refreshToken HttpOnly 쿠키는 credentials: 'include' 로 자동 전송
 * - 동시에 여러 요청이 401/403을 맞아도 실제 refresh 호출은 한 번만 하도록 큐 처리
 */
async function refreshAccessToken() {
  if (isRefreshing) {
    // 이미 다른 요청이 refresh 중이면, 그 결과를 기다렸다가 따라감
    return new Promise((resolve) => {
      refreshWaitQueue.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // ⭐ refreshToken 쿠키 전송 필수
      headers: {
        "Content-Type": "application/json",
      },
    });

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    // 토큰 재발급 성공 (로그인 응답과 유사 포맷 가정)
    // result.accessToken / result.token 둘 다 대응
    const newToken =
      data?.result?.accessToken ||
      data?.result?.token ||
      data?.accessToken ||
      data?.token ||
      null;

    if (res.ok && data && newToken) {
      setAccessToken(newToken);

      refreshWaitQueue.forEach((resolve) => resolve(true));
      refreshWaitQueue = [];
      return true;
    }

    // 재발급 실패 → 로그인 다시 유도
    refreshWaitQueue.forEach((resolve) => resolve(false));
    refreshWaitQueue = [];
    clearAccessTokenAndRedirect();
    return false;
  } catch (error) {
    console.error("토큰 재발급 실패:", error);
    refreshWaitQueue.forEach((resolve) => resolve(false));
    refreshWaitQueue = [];
    clearAccessTokenAndRedirect();
    return false;
  } finally {
    isRefreshing = false;
  }
}

/**
 * 공통 API 호출 함수
 *
 * 사용 예)
 *  const result = await apiFetch("/auth/login", {
 *    method: "POST",
 *    includeAuth: false,
 *    body: { email, password }
 *  });
 *
 * options:
 *  - includeAuth: true면 Authorization 헤더 자동 추가 (기본 true)
 *  - headers: 추가 헤더
 *  - body: JS 객체 or FormData
 *  - method, 기타 fetch 옵션들 (...rest)
 */
export async function apiFetch(path, options = {}) {
  const {
    includeAuth = true,
    headers: customHeaders = {},
    body,
    retryOnAuthError = true, // 401/403 때 refresh 후 재시도 여부 (내부에서만 조절)
    ...rest
  } = options;

  const url = buildUrl(path);
  const isFormData = body instanceof FormData;

  let bodyToSend = body;
  // FormData가 아니고 body가 있으면 JSON 문자열로 변환
  if (!isFormData && body !== undefined && typeof body !== "string") {
    bodyToSend = JSON.stringify(body);
  }

  const headers = buildHeaders(includeAuth, customHeaders, body);

  let response;

  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: bodyToSend,
      // RT 쿠키를 다른 API에서 쓸 일은 거의 없지만,
      // CORS 정합성을 위해 include로 통일해두는 것도 나쁘지 않음
      credentials: "include",
    });
  } catch (networkError) {
    console.error("네트워크 오류:", networkError);
    throw {
      message: "서버와 통신할 수 없습니다.",
      status: 0,
      code: 0,
      raw: networkError,
    };
  }

  // --------------------------
  // 401/403 처리 (Access Token 만료 등)
  // --------------------------
  const isAuthError = response.status === 401 || response.status === 403;

  const isAuthPath =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout");

  if (isAuthError && includeAuth && retryOnAuthError && !isAuthPath) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // 새 토큰으로 한 번만 재시도
      return apiFetch(path, {
        ...options,
        retryOnAuthError: false, // 무한 루프 방지
      });
    }

    // 재발급 실패 시 refreshAccessToken에서 redirect 처리됨
    throw {
      message: "인증이 만료되었습니다. 다시 로그인해주세요.",
      status: response.status,
      code: response.status,
    };
  }

  // --------------------------
  // 정상/기타 응답 처리
  // --------------------------
  const data = await parseJsonResponse(response);

  // 백엔드 ApiResponse 규격: { isSuccess, code, message, result } 라고 가정
  const isHttpError = !response.ok;
  const isApiFail = data && data.isSuccess === false;

  if (isHttpError || isApiFail) {
    throw buildError(response, data);
  }

  // 정상일 때 result만 반환
  return data.result;
}
