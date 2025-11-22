// js/api-fetch.js

// ✅ 모든 API 호출에서 공통으로 쓸 BASE URL
export const API_BASE_URL = "http://localhost:8080";

/**
 * 이미지 URL 보정 유틸
 * - 이미 http/https 절대경로면 그대로 사용
 * - '/'로 시작하면 API_BASE_URL 붙여줌  → http://localhost:8080/uploads/...
 * - 그 외 상대 경로면  API_BASE_URL + '/' + url 형태로 붙임
 */
export function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return API_BASE_URL + url;
  return `${API_BASE_URL}/${url}`;
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
    includeAuth = true,   // false 주면 Authorization 헤더 안 붙임 (로그인/회원가입 등)
    headers: customHeaders = {},
    body,
    ...rest
  } = options;

  const token = includeAuth ? localStorage.getItem("accessToken") : null;

  const headers = { ...customHeaders };

  let bodyToSend = body;
  const isFormData = body instanceof FormData;

  // 🔹 FormData가 아니고, body가 있으면 → JSON으로 보냄
  if (!isFormData && body !== undefined) {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (typeof body !== "string") {
      bodyToSend = JSON.stringify(body);
    }
  }

  // 🔹 Authorization 헤더 공통 처리
  if (includeAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 🔹 path가 절대 URL이면 그대로, 아니면 API_BASE_URL 붙이기
  const url =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : API_BASE_URL + path;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: bodyToSend,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw {
      isSuccess: false,
      code: response.status,
      message: "서버 응답 형식이 올바르지 않습니다.",
      result: null,
    };
  }

  if (!response.ok || data.isSuccess === false) {
    throw {
      isSuccess: false,
      code: data.code ?? response.status,
      message: data.message ?? "요청 실패",
      result: null,
    };
  }

  return data.result;
}
