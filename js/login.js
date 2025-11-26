import { apiFetch } from "./api-fetch.js";
import { isValidEmail, isValidPassword } from "./validation.js";
import { showToast } from "./utils.js";

// HTML 요소 가져오기 (login.html 구조와 정확히 맞춤)
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const goSignupBtn = document.getElementById("go-signup-btn");

const emailError = document.getElementById("login-email-error");
const pwError = document.getElementById("login-pw-error");

// ---------- 버튼 활성/비활성 업데이트 ----------
function updateButtonState() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const emailOk = isValidEmail(email);
  const pwOk = isValidPassword(password);

  // 에러 메시지 표시/숨김
  if (!emailOk && email.length > 0) {
    emailError.classList.remove("hidden");
  } else {
    emailError.classList.add("hidden");
  }

  if (!pwOk && password.length > 0) {
    pwError.classList.remove("hidden");
  } else {
    pwError.classList.add("hidden");
  }

  const canSubmit = emailOk && pwOk;

  loginBtn.disabled = !canSubmit;
  if (canSubmit) {
    loginBtn.classList.remove("disabled");
    loginBtn.classList.add("active");
  } else {
    loginBtn.classList.add("disabled");
    loginBtn.classList.remove("active");
  }
}

// ---------- 로그인 요청 ----------
async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // 최종 방어 (버튼이 활성인데도 혹시 모를 상황 대비)
  if (!isValidEmail(email) || !isValidPassword(password)) {
    showToast("이메일/비밀번호 형식을 다시 확인해주세요.");
    return;
  }

  try {
    // /auth/login 호출 (공통 apiFetch 사용)
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    });

    // 응답 형태:
    // {
    //   token: "dummy-4",
    //   user: { id: "4", email: "test@example.com" }
    // }
    const { token, user } = result;

    // 토큰 저장 (이름은 백엔드와 합의한 키 사용)
    localStorage.setItem("accessToken", token);
    if (user?.id) {
      localStorage.setItem("userId", String(user.id));
    }
    if (user?.email) {
      localStorage.setItem("userEmail", user.email);
    }

    showToast("로그인 성공! 게시판으로 이동합니다.");
    window.location.href = "./posts.html";
  } catch (err) {
    console.error(err);
    showToast(err.message || "로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.");
  }
}

// ---------- 이벤트 바인딩 ----------
emailInput.addEventListener("input", updateButtonState);
passwordInput.addEventListener("input", updateButtonState);

loginBtn.addEventListener("click", handleLogin);

goSignupBtn.addEventListener("click", () => {
  window.location.href = "./signup.html";
});

// 처음 진입 시 버튼 상태 초기화
updateButtonState();
