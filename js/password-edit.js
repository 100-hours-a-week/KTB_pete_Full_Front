// 비밀번호 수정 페이지 전용 스크립트
import { initHeader } from "./header.js";
import { apiFetch } from "./api-fetch.js";
import {
  isValidPassword,
  PASSWORD_RULE_MESSAGE,
} from "./validation.js";
import { showToast } from "./utils.js"

initHeader();

// ---- 상수 ----
const PASSWORD_CHANGE_PATH = "/users/me/password";

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

// ---- 유효성 검사 ----
function validatePassword() {
  const value = passwordInput.value.trim();

  if (!value) {
    passwordHelper.textContent = "*비밀번호를 입력해주세요.";
    isPasswordValid = false;
    return;
  }

  if (!isValidPassword(value)) {
    passwordHelper.textContent = `*${PASSWORD_RULE_MESSAGE}`;
    isPasswordValid = false;
    return;
  }

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

// ---- 실제 비밀번호 변경 API 호출 ----
async function updatePasswordApi(newPassword, confirmPassword) {
  await apiFetch(PASSWORD_CHANGE_PATH, {
    method: "PATCH",
    body: {
      newPassword,  
      confirmPassword, 
    },
  });
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

  const newPassword = passwordInput.value.trim();
  const confirmPassword = passwordConfirmInput.value.trim();

  try {
    submitBtn.disabled = true;

    await updatePasswordApi(newPassword, confirmPassword);

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
    showToast(error.message || "비밀번호 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    updateSubmitButtonState();
  }
});
