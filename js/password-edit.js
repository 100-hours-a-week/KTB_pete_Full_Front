// js/password-edit.js
// 비밀번호 수정 페이지 전용 스크립트
import { initHeader } from "./header.js";
import { apiFetch } from "./api-fetch.js";

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

// ---- 실제 비밀번호 변경 API 호출 ----
async function updatePasswordApi(newPassword, confirmPassword) {
  // apiFetch가 알아서:
  // - Content-Type: application/json
  // - Authorization: Bearer <token> (localStorage.accessToken)
  // 붙여서 호출함
  await apiFetch(PASSWORD_CHANGE_PATH, {
    method: "PATCH",
    body: {
      newPassword,      // ✅ 백엔드 DTO 필드명과 일치
      confirmPassword,  // ✅ 백엔드 DTO 필드명과 일치
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
    alert(error.message || "비밀번호 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    updateSubmitButtonState();
  }
});
