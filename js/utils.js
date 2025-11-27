// 쓰로틀: delay(ms) 동안 최대 한 번만 실행
export function throttle(fn, delay = 200) {
  let last = 0;
  let timeoutId = null;

  return (...args) => {
    const now = Date.now();
    const remaining = delay - (now - last);

    if (remaining <= 0) {
      last = now;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      fn(...args);
    } else if (!timeoutId) {
      // 마지막 호출로부터 delay가 지나지 않았으면, 남은 시간 이후에 한 번 더 실행
      timeoutId = setTimeout(() => {
        last = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}
// innerHTML 방어용
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 필요하면 나중에 디바운스
export function debounce(fn, delay = 200) {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

// ------------------------------
// 공통 토스트 메시지
// ------------------------------
let toastTimeoutId = null;

export function showToast(message, { duration = 2000 } = {}) {
  const toastEl =
    document.getElementById("toast") ||
    document.getElementById("profile-toast") ||
    document.getElementById("global-toast");

  if (!toastEl) {
    // 토스트 DOM이 없으면 기존 alert로 폴백
    alert(message);
    return;
  }

  toastEl.textContent = message;
  toastEl.classList.remove("hidden");

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    toastEl.classList.add("hidden");
  }, duration);
}