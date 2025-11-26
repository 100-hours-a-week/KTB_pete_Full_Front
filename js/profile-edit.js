import { initHeader } from "./header.js";
import { apiFetch } from "./api-fetch.js";
import { requirePageAuth, handleAuthError } from "./auth.js";
import { showToast } from "./utils.js";

initHeader();

// 페이지 가드
requirePageAuth();

// 백엔드 실제 경로에 맞춰서 수정하면 됨
const PROFILE_ME_PATH = "/users/me";
// 백엔드에서 프로필 이미지 필드명
const PROFILE_IMAGE_FIELD_NAME = "profileImage";

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
  try {
    const user = await apiFetch(PROFILE_ME_PATH, {
      method: "GET",
    });
    renderProfile(user);
  } catch (err) {
    console.error(err);
    if (handleAuthError(err)) return;
    showToast(err.message || "회원 정보를 불러오지 못했습니다.");
  }
}

function renderProfile(user) {
  emailInput.value = user.email || "";
  nicknameInput.value = user.nickname || "";
  const imageUrl = user.profileImageUrl || user.profileImage || user.image;
  if (imageUrl) {
    profileImg.src = imageUrl;
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

  try {
    const formData = new FormData();
    formData.append("nickname", nickname.trim());
    if (uploadedImageFile) {
      formData.append(PROFILE_IMAGE_FIELD_NAME, uploadedImageFile);
    }

    await apiFetch(PROFILE_ME_PATH, {
      method: "PATCH",
      body: formData,
    });

    showToast("수정 완료");
  } catch (err) {
    console.error(err);

    if (handleAuthError(err)) return;

    if (err.code === 409) {
      nicknameHelper.textContent = "*중복된 닉네임 입니다.";
      return;
    }

    showToast(err.message || "회원 정보 수정에 실패했습니다.");
  }
});

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
  try {
    await apiFetch(PROFILE_ME_PATH, {
      method: "DELETE",
    });

    showToast("회원 탈퇴가 완료되었습니다.");
    localStorage.removeItem("accessToken");
    window.location.href = "./login.html";
  } catch (err) {
    console.error(err);
    if (handleAuthError(err)) return;
    showToast(err.message || "회원 탈퇴에 실패했습니다.");
  }
});

// ------------------------
// 초기 실행
// ------------------------
loadProfile();
updateSaveButtonStyle();
