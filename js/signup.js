// js/signup.js
import { apiFetch } from "./api-fetch.js";

// ===== 상수 =====
// 백엔드에서 프로필 이미지 필드명을 뭐라고 받는지 맞춰줘야 함.
// 예: @RequestPart("profileImage") MultipartFile profileImage
const PROFILE_IMAGE_FIELD_NAME = "profileImage";

// ===== DOM 요소 찾기 =====
const profilePlaceholder = document.getElementById("profile-placeholder");
const profileInput = document.getElementById("profile-input");
const profilePreview = document.getElementById("profile-preview");
const profileHelper = document.getElementById("profile-helper");

const emailInput = document.getElementById("signup-email");
const passwordInput = document.getElementById("signup-password");
const passwordConfirmInput = document.getElementById("signup-password-confirm");
const nicknameInput = document.getElementById("signup-nickname");

const emailError = document.getElementById("signup-email-error");
const pwError = document.getElementById("signup-pw-error");
const pwConfirmError = document.getElementById("signup-pw-confirm-error");
const nicknameError = document.getElementById("signup-nickname-error");

const signupBtn = document.getElementById("signup-btn");
const goLoginBtn = document.getElementById("signup-go-login-btn");

// 실제로 서버로 전송할 파일
let selectedProfileFile = null;

// ===== 검증 유틸 =====
function isValidEmail(value) {
  if (!value) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

function isValidPassword(value) {
  if (!value) return false;
  // 8~20자, 대문자/소문자/숫자/특수문자 각각 1개 이상
  const pwRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|;:'",.<>/?`~]).{8,20}$/;
  return pwRegex.test(value);
}

// ===== 폼 전체 검증 + 버튼 상태 갱신 =====
function validateForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const passwordConfirm = passwordConfirmInput.value.trim();
  const nickname = nicknameInput.value.trim();

  let isValid = true;

  // --- 이메일 ---
  if (!email) {
    emailError.textContent = "이메일을 입력해주세요.";
    emailError.classList.remove("hidden");
    isValid = false;
  } else if (!isValidEmail(email)) {
    emailError.textContent = "올바른 이메일 주소 형식을 입력해주세요.";
    emailError.classList.remove("hidden");
    isValid = false;
  } else {
    emailError.classList.add("hidden");
  }

  // --- 비밀번호 ---
  if (!password) {
    pwError.textContent = "비밀번호를 입력해주세요.";
    pwError.classList.remove("hidden");
    isValid = false;
  } else if (!isValidPassword(password)) {
    pwError.textContent =
      "비밀번호는 8~20자이며 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.";
    pwError.classList.remove("hidden");
    isValid = false;
  } else {
    pwError.classList.add("hidden");
  }

  // --- 비밀번호 확인 ---
  if (!passwordConfirm) {
    pwConfirmError.textContent = "비밀번호를 한번 더 입력해주세요.";
    pwConfirmError.classList.remove("hidden");
    isValid = false;
  } else if (password && password !== passwordConfirm) {
    pwConfirmError.textContent = "비밀번호가 일치하지 않습니다.";
    pwConfirmError.classList.remove("hidden");
    isValid = false;
  } else {
    pwConfirmError.classList.add("hidden");
  }

  // --- 닉네임 ---
  if (!nickname) {
    nicknameError.textContent = "닉네임을 입력해주세요.";
    nicknameError.classList.remove("hidden");
    isValid = false;
  } else if (nickname.length > 20) {
    nicknameError.textContent = "닉네임은 최대 20자까지 가능합니다.";
    nicknameError.classList.remove("hidden");
    isValid = false;
  } else {
    nicknameError.classList.add("hidden");
  }

  // 버튼 상태 업데이트
  signupBtn.disabled = !isValid;
  if (isValid) {
    signupBtn.classList.remove("disabled");
    signupBtn.classList.add("active");
  } else {
    signupBtn.classList.add("disabled");
    signupBtn.classList.remove("active");
  }

  return isValid;
}

// ===== 프로필 이미지 선택/미리보기 =====
profilePlaceholder.addEventListener("click", () => {
  profileInput.click();
});

profileInput.addEventListener("change", () => {
  const file = profileInput.files[0];

  if (!file) {
    // 선택 취소한 경우
    selectedProfileFile = null;
    profilePreview.src = "";
    profilePreview.classList.add("hidden");
    profileHelper.classList.remove("hidden");
    return;
  }

  selectedProfileFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    profilePreview.src = e.target.result; // data URL
    profilePreview.classList.remove("hidden");
    profileHelper.classList.add("hidden");
  };
  reader.readAsDataURL(file);
});

// ===== 회원가입 요청 =====
async function handleSignup() {
  const ok = validateForm();
  if (!ok) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const nickname = nicknameInput.value.trim();

  try {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("nickname", nickname);

    // 프로필 이미지는 선택했을 때만 전송 (선택 안 하면 null/기본 이미지로 처리)
    if (selectedProfileFile) {
      formData.append(PROFILE_IMAGE_FIELD_NAME, selectedProfileFile);
    }

    const result = await apiFetch("/auth/signup", {
      method: "POST",
      body: formData,
      includeAuth: false, // 비로그인 상태
    });

    // result 예시:
    // { id, nickname, email, profileImageUrl ... }

    alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
    window.location.href = "./login.html";
  } catch (err) {
    console.error(err);
    alert(err.message || "회원가입에 실패했습니다. 입력 값을 다시 확인해주세요.");
  }
}

// ===== 이벤트 바인딩 =====
emailInput.addEventListener("input", validateForm);
passwordInput.addEventListener("input", validateForm);
passwordConfirmInput.addEventListener("input", validateForm);
nicknameInput.addEventListener("input", validateForm);

signupBtn.addEventListener("click", handleSignup);

goLoginBtn.addEventListener("click", () => {
  window.location.href = "./login.html";
});

// 초기 진입 시 버튼 상태 세팅
validateForm();
