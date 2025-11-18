// js/password-edit.js
// 비밀번호 수정 페이지 전용 스크립트
import { initHeader } from "./header.js";

initHeader();
// (선택) 실제 연동 시 사용할 토큰 유틸 – 존재한다고 가정
// import { getAuthToken, requireAuth } from "./common/auth.js";

// ---- DOM 참조 ----
const passwordInput = document.getElementById("password");
const passwordConfirmInput = document.getElementById("passwordConfirm");
const passwordHelper = document.getElementById("password-helper");
const passwordConfirmHelper = document.getElementById("password-confirm-helper");
const submitBtn = document.getElementById("password-submit-btn");
const form = document.getElementById("password-edit-form");
const toastEl = document.getElementById("toast");

let isPasswordValid = false;
let isConfirmValid = false;

// ---- 비밀번호 규칙 ----
// 8~20자, 대문자/소문자/숫자/특수문자 각 1개 이상
const passwordRuleRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;

// ---- 유효성 검사 ----
function validatePassword() {
  const value = passwordInput.value.trim();

  if (!value) {
    passwordHelper.textContent = "*비밀번호를 입력해주세요.";
    isPasswordValid = false;
    return;
  }

  if (!passwordRuleRegex.test(value)) {
    passwordHelper.textContent =
      "*비밀번호는 8~20자이며 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
    isPasswordValid = false;
    return;
  }

  // 규칙 통과
  passwordHelper.textContent = "";
  isPasswordValid = true;
}

function validatePasswordConfirm() {
  const value = passwordConfirmInput.value.trim();
  const passwordValue = passwordInput.value.trim();

  if (!value) {
    passwordConfirmHelper.textContent = "*비밀번호를 한번 더 입력해주세요.";
    isConfirmValid = false;
    return;
  }

  if (value !== passwordValue) {
    passwordConfirmHelper.textContent = "*비밀번호와 다릅니다.";
    isConfirmValid = false;
    return;
  }

  passwordConfirmHelper.textContent = "";
  isConfirmValid = true;
}

function updateSubmitButtonState() {
  if (isPasswordValid && isConfirmValid) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

// ---- 토스트 표시 ----
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  // opacity 애니메이션
  requestAnimationFrame(() => {
    toastEl.classList.add("show");
  });

  setTimeout(() => {
    toastEl.classList.remove("show");
    setTimeout(() => {
      toastEl.classList.add("hidden");
    }, 250);
  }, 2000);
}

// ---- 더미 API 호출 (나중에 실제 API로 교체) ----
async function updatePasswordApi(newPassword) {
  // 실제 구현 예시 (백엔드 연결 시 교체)
  /*
  const token = getAuthToken();
  const res = await fetch("/api/users/me/password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (!res.ok) {
    throw new Error("비밀번호 수정 실패");
  }
  */

  // 지금은 개발 편의를 위한 더미 구현
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true };
}

// ---- 이벤트 바인딩 ----
passwordInput.addEventListener("input", () => {
  validatePassword();
  validatePasswordConfirm(); // 비밀번호가 바뀌면 확인 값도 다시 체크
  updateSubmitButtonState();
});

passwordConfirmInput.addEventListener("input", () => {
  validatePassword();
  validatePasswordConfirm();
  updateSubmitButtonState();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  validatePassword();
  validatePasswordConfirm();
  updateSubmitButtonState();

  if (!isPasswordValid || !isConfirmValid) {
    return;
  }

  try {
    submitBtn.disabled = true;

    const newPassword = passwordInput.value.trim();
    await updatePasswordApi(newPassword);

    // 성공 토스트
    showToast("수정 완료");

    // 입력값 초기화
    passwordInput.value = "";
    passwordConfirmInput.value = "";
    isPasswordValid = false;
    isConfirmValid = false;
    updateSubmitButtonState();
  } catch (error) {
    console.error(error);
    alert("비밀번호 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    updateSubmitButtonState();
  }
});

// ---- 페이지 진입 시 인증 체크 (선택) ----
// requireAuth && requireAuth();
