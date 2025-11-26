import { initHeader } from "./header.js";
import { apiFetch } from "./api-fetch.js";
import { requirePageAuth, handleAuthError } from "./auth.js";
import { showToast } from "./utils.js";
initHeader();

// 페이지 진입 기드
requirePageAuth();

// ------------------------------
// DOM 요소
// ------------------------------
const backBtn = document.getElementById("back-btn");
const titleInput = document.getElementById("title-input");
const titleLengthEl = document.getElementById("title-length");
const contentInput = document.getElementById("content-input");
const imageInput = document.getElementById("image-input");
const fileNameText = document.getElementById("file-name");
const submitBtn = document.getElementById("submit-create-btn");

// ------------------------------
// 상태
// ------------------------------
let selectedFile = null;

// ------------------------------
// 유틸
// ------------------------------
function updateTitleLength() {
  const len = titleInput.value.length;
  if (titleLengthEl) {
    titleLengthEl.textContent = `${len} / 26`;
  }
}

function validateForm() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  let isValid = true;

  if (!title) isValid = false;
  if (!content) isValid = false;

  submitBtn.disabled = !isValid;
  if (isValid) {
    submitBtn.classList.remove("disabled");
  } else {
    submitBtn.classList.add("disabled");
  }

  return isValid;
}

// ------------------------------
// 게시글 생성 요청
// ------------------------------
async function handleCreatePost() {
  const ok = validateForm();
  if (!ok) return;

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  if (selectedFile) {
    formData.append("image", selectedFile);
  }

  try {
    const result = await apiFetch("/board/posts", {
      method: "POST",
      body: formData,
    });

    showToast("게시글이 작성되었습니다.");

    if (result && result.id) {
      window.location.href = `./post-detail.html?postId=${result.id}`;
    } else {
      window.location.href = "./posts.html";
    }
  } catch (err) {
    console.error("게시글 작성 실패:", err);

    // 🔐 401 이라면 공통 처리 (로그인 만료 등)
    if (handleAuthError(err)) return;

    showToast(
      err.message || "게시글 작성에 실패했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}

// ------------------------------
// 이벤트 바인딩
// ------------------------------
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "./posts.html";
  });
}

titleInput.addEventListener("input", () => {
  if (titleInput.value.length > 26) {
    titleInput.value = titleInput.value.slice(0, 26);
  }
  updateTitleLength();
  validateForm();
});

contentInput.addEventListener("input", () => {
  validateForm();
});

imageInput.addEventListener("change", (e) => {
  const files = e.target.files;
  if (!files || !files.length) {
    selectedFile = null;
    fileNameText.textContent = "파일을 선택해주세요.";
    return;
  }

  selectedFile = files[0];
  fileNameText.textContent = selectedFile.name;
});

submitBtn.addEventListener("click", handleCreatePost);

// 초기 상태
updateTitleLength();
validateForm();
