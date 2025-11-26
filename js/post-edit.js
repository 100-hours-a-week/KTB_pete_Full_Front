import { initHeader } from "./header.js";
import { apiFetch } from "./api-fetch.js";
import { showToast } from "./utils.js"

initHeader();

const IMAGE_FIELD_NAME = "imageFile"; // create에서 imageFile 쓰고 있으면 그대로 이 값 사용

// ------------------------------
// postId
// ------------------------------
function getPostIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("postId");
  return id ? Number(id) : null;
}

const postId = getPostIdFromQuery();
if (!postId) {
  showToast("잘못된 접근입니다. 게시글 ID가 없습니다.");
  window.location.href = "./posts.html";
}

// ------------------------------
// DOM
// ------------------------------
const backBtn = document.getElementById("back-btn");
const titleInput = document.getElementById("title-input");
const titleLength = document.getElementById("title-length");
const contentInput = document.getElementById("content-input");
const imageInput = document.getElementById("image-input");
const fileNameText = document.getElementById("file-name");
const submitBtn = document.getElementById("submit-edit-btn");

// ------------------------------
// 상태
// ------------------------------
let selectedFile = null;      // 새로 선택한 파일
let existingImageUrl = null;  // 기존 이미지 URL (백엔드에서 받은 값)

// ------------------------------
// 유틸
// ------------------------------
function updateTitleLength() {
  const len = titleInput.value.length;
  if (titleLength) {
    titleLength.textContent = `${len} / 26`;
  }
}

function validateForm() {
  const titleOk = titleInput.value.trim().length > 0;
  const contentOk = contentInput.value.trim().length > 0;

  const canSubmit = titleOk && contentOk;
  submitBtn.disabled = !canSubmit;

  if (canSubmit) {
    submitBtn.classList.remove("disabled");
  } else {
    submitBtn.classList.add("disabled");
  }

  return canSubmit;
}

// 파일명만 예쁘게 뽑고 싶으면 사용
function extractFileNameFromUrl(url) {
  if (!url) return "";
  try {
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  } catch {
    return url;
  }
}

// ------------------------------
// 기존 게시글 불러오기
// ------------------------------
async function loadExistingPost() {
  try {
    // GET /board/posts/{postId}
    const detail = await apiFetch(
      `/board/posts/${encodeURIComponent(postId)}`,
      {
        method: "GET",
        includeAuth: false, // 상세 조회는 비로그인도 가능
      }
    );

    // detail = PostResponse.result
    const existing = {
      id: detail.id,
      title: detail.title,
      content: detail.content,
      imageUrl: detail.image, // 백엔드 필드명이 image라고 가정
    };

    applyExistingPost(existing);
  } catch (err) {
    console.error(err);
    showToast(err.message || "게시글 정보를 불러오지 못했습니다.");
    window.location.href = "./posts.html";
  }
}

function applyExistingPost(post) {
  titleInput.value = post.title ?? "";
  contentInput.value = post.content ?? "";
  existingImageUrl = post.imageUrl ?? null;

  // 기존 파일명이 있다면 파일명만 표시
  if (existingImageUrl) {
    const name = extractFileNameFromUrl(existingImageUrl);
    fileNameText.textContent = name || "기존 파일 명";
  } else {
    fileNameText.textContent = "기존 파일 명";
  }

  updateTitleLength();
  validateForm();
}

// ------------------------------
// 수정 요청
// ------------------------------
async function submitEdit() {
  const canSubmit = validateForm();
  if (!canSubmit) return;

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  // 로그인 체크
  const token = localStorage.getItem("accessToken");
  if (!token) {
    showToast("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
    return;
  }

  // multipart/form-data
  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);

  // 새 파일을 선택한 경우에만 이미지 파트 추가
  if (selectedFile) {
    formData.append(IMAGE_FIELD_NAME, selectedFile);
  }
  // 선택 안 했으면 이미지 파트 안 보내서, 백엔드가 "기존 이미지 유지" 하도록

  try {
    // PATCH /board/posts/{postId}
    await apiFetch(`/board/posts/${encodeURIComponent(postId)}`, {
      method: "PATCH",
      body: formData,
      // apiFetch가 FormData면 Content-Type 자동 처리, 토큰 자동 포함
    });

    showToast("게시글이 수정되었습니다.");
    window.location.href = `./post-detail.html?postId=${postId}`;
  } catch (err) {
    console.error(err);
    showToast(err.message || "게시글 수정에 실패했습니다.");
  }
}

// ------------------------------
// 이벤트 바인딩
// ------------------------------
backBtn.addEventListener("click", () => {
  window.location.href = `./post-detail.html?postId=${postId}`;
});

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
    // 새 파일 선택 취소하면, 다시 기존 파일명으로 표시
    const name = extractFileNameFromUrl(existingImageUrl);
    fileNameText.textContent = name || "기존 파일 명";
    return;
  }

  selectedFile = files[0];
  fileNameText.textContent = selectedFile.name;
});

submitBtn.addEventListener("click", submitEdit);

// ------------------------------
// 초기 로딩
// ------------------------------
loadExistingPost();
