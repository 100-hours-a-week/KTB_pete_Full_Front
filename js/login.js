// js/login.js

// ------------------------------
// 개발용 로그인 플래그
// 나중에 실제 백엔드 붙일 때 false로 변경하면 됨
// ------------------------------
const USE_MOCK_LOGIN = true;

// 개발용 계정
const DEV_EMAIL = "dev@example.com";
const DEV_PASSWORD = "Dev1234!";

const emailInput = document.getElementById("login-email");
const pwInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const goSignupBtn = document.getElementById("go-signup-btn");

const emailError = document.getElementById("login-email-error");
const pwError = document.getElementById("login-pw-error");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|;:'",.<>/?]).{8,20}$/;

// 버튼 활성/비활성
function updateLoginButton() {
  const emailValid = emailRegex.test(emailInput.value.trim());
  const pwValid = passwordRegex.test(pwInput.value);

  if (emailValid && pwValid) {
    loginBtn.disabled = false;
    loginBtn.classList.remove("disabled");
    loginBtn.classList.add("active");
  } else {
    loginBtn.disabled = true;
    loginBtn.classList.add("disabled");
    loginBtn.classList.remove("active");
  }
}

emailInput.addEventListener("input", updateLoginButton);
pwInput.addEventListener("input", updateLoginButton);

// blur 시 helper text
emailInput.addEventListener("blur", () => {
  const value = emailInput.value.trim();
  if (value === "" || !emailRegex.test(value)) {
    emailError.classList.remove("hidden");
  } else {
    emailError.classList.add("hidden");
  }
});

pwInput.addEventListener("blur", () => {
  const value = pwInput.value;
  if (value === "" || !passwordRegex.test(value)) {
    pwError.classList.remove("hidden");
  } else {
    pwError.classList.add("hidden");
  }
});

// ------------------------------
// 개발용 로그인 함수
// ------------------------------
function mockLogin(email, password) {
  if (email === DEV_EMAIL && password === DEV_PASSWORD) {
    // 개발용 더미 토큰 저장
    localStorage.setItem("accessToken", "DEV-TOKEN");
    alert("개발용 계정으로 로그인되었습니다.");
    window.location.href = "./posts.html"; // 게시글 목록 페이지
  } else {
    alert(
      "개발용 계정이 아닙니다.\n\n테스트용 계정\n이메일: " +
        DEV_EMAIL +
        "\n비밀번호: " +
        DEV_PASSWORD
    );
  }
}

// ------------------------------
// 실제 로그인(백엔드 연동용) – 나중에 USE_MOCK_LOGIN=false로 바꾸고 사용
// ------------------------------
async function realLogin(email, password) {
  try {
    const res = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "로그인 실패");
      return;
    }

    // 실제 토큰 이름에 맞춰 변경
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }

    alert("로그인 성공!");
    window.location.href = "./posts.html";
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  }
}

// ------------------------------
// 로그인 버튼 클릭
// ------------------------------
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = pwInput.value;

  if (USE_MOCK_LOGIN) {
    mockLogin(email, password);
  } else {
    realLogin(email, password);
  }
});

// 회원가입으로 이동
goSignupBtn.addEventListener("click", () => {
  window.location.href = "./signup.html";
});
