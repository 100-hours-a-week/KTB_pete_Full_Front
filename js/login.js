import { apiFetch } from "./api-fetch.js";
import { isValidEmail, isValidPassword } from "./validation.js";
import { showToast } from "./utils.js";

// HTML 요소 가져오기
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
  emailError.classList.toggle("hidden", emailOk || email.length === 0);
  pwError.classList.toggle("hidden", pwOk || password.length === 0);

  const canSubmit = emailOk && pwOk;

  loginBtn.disabled = !canSubmit;
  loginBtn.classList.toggle("active", canSubmit);
  loginBtn.classList.toggle("disabled", !canSubmit);
}

// ---------- 로그인 요청 ----------
async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!isValidEmail(email) || !isValidPassword(password)) {
    showToast("이메일/비밀번호 형식을 다시 확인해주세요.");
    return;
  }

  try {
    /**
     * 중요: /auth/login은 includeAuth: false
     * - 기존 토큰 필요 없음
     * - refreshToken 쿠키는 로그인 성공 응답에서 자동 저장됨 (브라우저가 처리)
     */
    const result = await apiFetch("/auth/login", {
      method: "POST",
      includeAuth: false,
      body: { email, password },
    });

    // 응답 예시:
    // {
    //   token: "<Access Token>",
    //   user: { id, email, nickname, profileImage }
    // }
    const { token, user } = result;

    // Access Token 프론트 저장 (JWT + Security 방식)
    localStorage.setItem("accessToken", token);

    // (선택) 사용자 정보 캐싱
    if (user?.id) localStorage.setItem("userId", user.id);
    if (user?.email) localStorage.setItem("userEmail", user.email);
    if (user?.nickname) localStorage.setItem("userNickname", user.nickname);
    if (user?.profileImage)
      localStorage.setItem("userProfileImage", user.profileImage);

    showToast("로그인 성공! 게시판으로 이동합니다.");

    window.location.href = "./posts.html";
  } catch (err) {
    console.error("로그인 오류:", err);
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

// 초기 버튼 상태
updateButtonState();
