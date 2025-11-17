// js/signup.js

// 요소들
const backBtn = document.getElementById("back-btn");
const profilePlaceholder = document.getElementById("profile-placeholder");
const profileInput = document.getElementById("profile-input");
const profilePreview = document.getElementById("profile-preview");
const profileHelper = document.getElementById("profile-helper");

const emailInput = document.getElementById("signup-email");
const pwInput = document.getElementById("signup-password");
const pwConfirmInput = document.getElementById("signup-password-confirm");
const nicknameInput = document.getElementById("signup-nickname");

const emailError = document.getElementById("signup-email-error");
const pwError = document.getElementById("signup-pw-error");
const pwConfirmError = document.getElementById("signup-pw-confirm-error");
const nicknameError = document.getElementById("signup-nickname-error");

const signupBtn = document.getElementById("signup-btn");
const goLoginBtn = document.getElementById("signup-go-login-btn");

// 상태
let profileFile = null;
let isProfileValid = false;
let isEmailValid = false;
let isPwValid = false;
let isPwConfirmValid = false;
let isNicknameValid = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|;:'",.<>/?]).{8,20}$/;

// 버튼 활성화
function updateSignupButton() {
  if (
    isProfileValid &&
    isEmailValid &&
    isPwValid &&
    isPwConfirmValid &&
    isNicknameValid
  ) {
    signupBtn.disabled = false;
    signupBtn.classList.remove("disabled");
    signupBtn.classList.add("active");
  } else {
    signupBtn.disabled = true;
    signupBtn.classList.add("disabled");
    signupBtn.classList.remove("active");
  }
}

// 프로필 이미지 업로드
profilePlaceholder.addEventListener("click", () => {
  profileInput.click();
});

profileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  profileFile = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    profilePreview.src = event.target.result;
    profilePreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);

  isProfileValid = true;
  profileHelper.classList.add("hidden");
  updateSignupButton();
});

// 이메일 검증
function validateEmail(showMessage = true) {
  const value = emailInput.value.trim();

  if (value === "") {
    isEmailValid = false;
    if (showMessage) {
      emailError.textContent = "이메일을 입력해주세요.";
      emailError.classList.remove("hidden");
    }
  } else if (!emailRegex.test(value)) {
    isEmailValid = false;
    if (showMessage) {
      emailError.textContent =
        "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
      emailError.classList.remove("hidden");
    }
  } else {
    isEmailValid = true;
    emailError.classList.add("hidden");
  }
  updateSignupButton();
}

emailInput.addEventListener("input", () => validateEmail(false));
emailInput.addEventListener("blur", () => validateEmail(true));

// 비밀번호 검증
function validatePassword(showMessage = true) {
  const value = pwInput.value;

  if (value === "") {
    isPwValid = false;
    if (showMessage) {
      pwError.textContent = "비밀번호를 입력해주세요.";
      pwError.classList.remove("hidden");
    }
  } else if (!passwordRegex.test(value)) {
    isPwValid = false;
    if (showMessage) {
      pwError.textContent =
        "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
      pwError.classList.remove("hidden");
    }
  } else {
    isPwValid = true;
    pwError.classList.add("hidden");
  }
  validatePasswordConfirm(false);
  updateSignupButton();
}

pwInput.addEventListener("input", () => validatePassword(false));
pwInput.addEventListener("blur", () => validatePassword(true));

// 비밀번호 확인 검증
function validatePasswordConfirm(showMessage = true) {
  const value = pwConfirmInput.value;

  if (value === "") {
    isPwConfirmValid = false;
    if (showMessage) {
      pwConfirmError.textContent = "비밀번호를 한번 더 입력해주세요.";
      pwConfirmError.classList.remove("hidden");
    }
  } else if (value !== pwInput.value) {
    isPwConfirmValid = false;
    if (showMessage) {
      pwConfirmError.textContent = "비밀번호가 다릅니다.";
      pwConfirmError.classList.remove("hidden");
    }
  } else {
    isPwConfirmValid = true;
    pwConfirmError.classList.add("hidden");
  }
  updateSignupButton();
}

pwConfirmInput.addEventListener("input", () =>
  validatePasswordConfirm(false)
);
pwConfirmInput.addEventListener("blur", () =>
  validatePasswordConfirm(true)
);

// 닉네임 검증
function validateNickname(showMessage = true) {
  const value = nicknameInput.value;

  if (value.trim() === "") {
    isNicknameValid = false;
    if (showMessage) {
      nicknameError.textContent = "닉네임을 입력해주세요.";
      nicknameError.classList.remove("hidden");
    }
  } else if (/\s/.test(value)) {
    isNicknameValid = false;
    if (showMessage) {
      nicknameError.textContent = "띄어쓰기를 없애주세요.";
      nicknameError.classList.remove("hidden");
    }
  } else if (value.length > 10) {
    isNicknameValid = false;
    if (showMessage) {
      nicknameError.textContent = "닉네임은 최대 10자까지 작성 가능합니다.";
      nicknameError.classList.remove("hidden");
    }
  } else {
    isNicknameValid = true;
    nicknameError.classList.add("hidden");
  }
  updateSignupButton();
}

nicknameInput.addEventListener("input", () => validateNickname(false));
nicknameInput.addEventListener("blur", () => validateNickname(true));

// 페이지 이동 공통
function goLoginPage() {
  window.location.href = "./login.html";
}

backBtn.addEventListener("click", goLoginPage);
goLoginBtn.addEventListener("click", goLoginPage);

// 회원가입 API
signupBtn.addEventListener("click", async () => {
  if (!profileFile) {
    isProfileValid = false;
    profileHelper.textContent = "프로필 사진을 추가해주세요.";
    profileHelper.classList.remove("hidden");
  }

  validateEmail(true);
  validatePassword(true);
  validatePasswordConfirm(true);
  validateNickname(true);

  if (
    !isProfileValid ||
    !isEmailValid ||
    !isPwValid ||
    !isPwConfirmValid ||
    !isNicknameValid
  ) {
    updateSignupButton();
    return;
  }

  const formData = new FormData();
  formData.append("email", emailInput.value.trim());
  formData.append("password", pwInput.value);
  formData.append("passwordConfirm", pwConfirmInput.value);
  formData.append("nickname", nicknameInput.value.trim());
  formData.append("profileImage", profileFile);

  try {
    const res = await fetch("http://localhost:8080/auth/signup", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.message || "회원가입에 실패했습니다.";

      if (msg.includes("이메일")) {
        emailError.textContent = msg;
        emailError.classList.remove("hidden");
        isEmailValid = false;
      } else if (msg.includes("닉네임")) {
        nicknameError.textContent = msg;
        nicknameError.classList.remove("hidden");
        isNicknameValid = false;
      } else {
        alert(msg);
      }

      updateSignupButton();
      return;
    }

    alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
    goLoginPage();
  } catch (e) {
    console.error(e);
    alert("서버 오류가 발생했습니다.");
  }
});
