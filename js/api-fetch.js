export const API_BASE_URL = "http://localhost:8080";

/**
 * 이미지 URL 보정 유틸 (기존 로직 그대로 유지)
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
 * Authorization 헤더용 토큰 조회
 *    - 지금은 더미 토큰(dummy-4 같은 문자열)만 사용
 */
function getAccessToken() {
  return localStorage.getItem("accessToken");
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
      // → 백엔드의 TokenUtil.resolveUserId()가 여기 헤더를 파싱해서
      //    "dummy-123" 에서 userId를 꺼내쓰는 구조
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
      isSuccess: false,
      code: response.status,
      message: "서버 응답 형식이 올바르지 않습니다.",
      result: null,
    };
  }
}

/**
 * 백엔드 ApiResponse 규격 기준 에러 처리
 *  - HTTP status 에러
 *  - data.isSuccess === false
 */
function throwIfError(response, data) {
  const isHttpError = !response.ok;
  const isApiFail = data && data.isSuccess === false;

  if (!isHttpError && !isApiFail) {
    return;
  }

  const code = data && data.code ? data.code : response.status;
  const message =
    (data && data.message) || "요청 실패. 잠시 후 다시 시도해주세요.";

  throw {
    isSuccess: false,
    code,
    message,
    result: null,
  };
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
 */
export async function apiFetch(path, options = {}) {
  const {
    includeAuth = true,
    headers: customHeaders = {},
    body,
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

  const response = await fetch(url, {
    ...rest,
    headers,
    body: bodyToSend,
  });

  const data = await parseJsonResponse(response);
  throwIfError(response, data);

  // 백엔드에서 ApiResponse 형태로 내려준다고 가정: { isSuccess, code, message, result }
  return data.result;
}
