// js/profile-edit.js
import { initHeader } from "./header.js";

initHeader();

const USE_MOCK_PROFILE = true; // 나중에 실제 API 붙일 땐 false

// DOM 요소
const emailInput = document.getElementById("email-input");
const nicknameInput = document.getElementById("nickname-input");
const nicknameHelper = document.getElementById("nickname-helper");

const profileImg = document.getElementById("profile-image");
const profileImgChangeBtn = document.getElementById("profile-image-change-btn");
const profileImgInput = document.getElementById("profile-image-input");

const saveBtn = document.getElementById("profile-save-btn");
const withdrawBtn = document.getElementById("withdraw-btn");

const toastEl = document.getElementById("profile-toast");

const withdrawModal = document.getElementById("withdraw-modal");
const withdrawCancelBtn = document.getElementById("withdraw-cancel-btn");
const withdrawConfirmBtn = document.getElementById("withdraw-confirm-btn");

let toastTimer = null;
let uploadedImageFile = null;

// ------------------------
// 초기 유저 정보 로딩
// ------------------------
async function loadProfile() {
  if (USE_MOCK_PROFILE) {
    const mockUser = {
      email: "startupcode@gmail.com",
      nickname: "스타트업코드",
      profileImageUrl: "../assets/profile-sample.png",
    };
    renderProfile(mockUser);
    return;
  }

  try {
    const res = await fetch("http://localhost:8080/api/users/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "회원 정보를 불러오지 못했습니다.");
      return;
    }
    renderProfile(data);
  } catch (err) {
    console.error(err);
    alert("회원 정보를 불러오는 중 오류가 발생했습니다.");
  }
}

function renderProfile(user) {
  emailInput.value = user.email || "";
  nicknameInput.value = user.nickname || "";
  if (user.profileImageUrl) {
    profileImg.src = user.profileImageUrl;
  }
  updateSaveButtonStyle();
}

// ------------------------
// 닉네임 검증
// ------------------------
function validateNickname(value) {
  const nickname = value.trim();

  if (!nickname) {
    nicknameHelper.textContent = "*닉네임을 입력해주세요.";
    return false;
  }

  if (nickname.length > 10) {
    nicknameHelper.textContent = "*닉네임은 최대 10자 까지 작성 가능합니다.";
    return false;
  }

  nicknameHelper.textContent = "";
  return true;
}

function updateSaveButtonStyle() {
  const nicknameOk = nicknameInput.value.trim().length > 0;
  if (nicknameOk) {
    saveBtn.classList.add("enabled");
  } else {
    saveBtn.classList.remove("enabled");
  }
}

// ------------------------
// 프로필 이미지 변경
// ------------------------
profileImgChangeBtn.addEventListener("click", () => {
  profileImgInput.click();
});

profileImgInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  uploadedImageFile = file;

  const reader = new FileReader();
  reader.onload = (ev) => {
    profileImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ------------------------
// 저장(수정하기) 버튼
// ------------------------
saveBtn.addEventListener("click", async () => {
  const nickname = nicknameInput.value;

  if (!validateNickname(nickname)) {
    return;
  }

  if (USE_MOCK_PROFILE) {
    // 닉네임 중복 더미 체크: "중복" 이라는 텍스트가 포함되면 중복으로 가정
    if (nickname.includes("중복")) {
      nicknameHelper.textContent = "*중복된 닉네임 입니다.";
      return;
    }

    console.log("개발용: 프로필 수정 요청", {
      nickname,
      image: uploadedImageFile,
    });

    showToast("수정 완료");
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      window.location.href = "./login.html";
      return;
    }

    // 이미지가 포함되므로 FormData 사용
    const formData = new FormData();
    formData.append("nickname", nickname.trim());
    if (uploadedImageFile) {
      formData.append("profileImage", uploadedImageFile);
    }

    const res = await fetch("http://localhost:8080/api/users/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 409) {
      // 닉네임 중복 가정
      nicknameHelper.textContent = "*중복된 닉네임 입니다.";
      return;
    }

    if (!res.ok) {
      alert(data.message || "회원 정보 수정에 실패했습니다.");
      return;
    }

    showToast("수정 완료");
  } catch (err) {
    console.error(err);
    alert("회원 정보 수정 중 오류가 발생했습니다.");
  }
});

// ------------------------
// 토스트 표시
// ------------------------
function showToast(message) {
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.remove("hidden");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 2000);
}

// 닉네임 입력 변경 시 검증 + 버튼 스타일
nicknameInput.addEventListener("input", () => {
  validateNickname(nicknameInput.value);
  updateSaveButtonStyle();
});

// ------------------------
// 회원 탈퇴 모달
// ------------------------
withdrawBtn.addEventListener("click", () => {
  withdrawModal.classList.remove("hidden");
});

// 취소
withdrawCancelBtn.addEventListener("click", () => {
  withdrawModal.classList.add("hidden");
});

// 확인
withdrawConfirmBtn.addEventListener("click", async () => {
  if (USE_MOCK_PROFILE) {
    alert("개발용: 회원 탈퇴가 완료되었다고 가정하고 로그인 페이지로 이동합니다.");
    localStorage.removeItem("accessToken");
    window.location.href = "./login.html";
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "./login.html";
      return;
    }

    const res = await fetch("http://localhost:8080/api/users/me", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "회원 탈퇴에 실패했습니다.");
      return;
    }

    localStorage.removeItem("accessToken");
    window.location.href = "./login.html";
  } catch (err) {
    console.error(err);
    alert("회원 탈퇴 중 오류가 발생했습니다.");
  }
});

// ------------------------
// 초기 실행
// ------------------------
loadProfile();
updateSaveButtonStyle();
