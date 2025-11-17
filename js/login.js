// js/login.js

const emailInput = document.getElementById("login-email");
const pwInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const goSignupBtn = document.getElementById("go-signup-btn");

const emailError = document.getElementById("login-email-error");
const pwError = document.getElementById("login-pw-error");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|;:'",.<>/?]).{8,20}$/;

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

// 입력 시: 버튼 상태만 업데이트
emailInput.addEventListener("input", updateLoginButton);
pwInput.addEventListener("input", updateLoginButton);

// blur 시: helper text 노출
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

// 로그인 API 호출
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = pwInput.value;

  try {
    const res = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "로그인에 실패했습니다.");
      return;
    }

    // 토큰 저장 (백엔드 응답에 맞게 변경)
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }

    alert("로그인에 성공했습니다.");
    // 게시글 목록 페이지로 이동
    window.location.href = "./posts.html"; // 네가 실제 쓸 경로로 변경
  } catch (e) {
    console.error(e);
    alert("서버 오류가 발생했습니다.");
  }
});

// 회원가입으로 이동
goSignupBtn.addEventListener("click", () => {
  window.location.href = "./signup.html";
});
