// js/post-create.js
import { initHeader } from "./header.js";

initHeader();


// ------------------------------
// 개발 플래그
// ------------------------------
const USE_MOCK_CREATE = true; // true: 더미 모드, false: 실제 API 사용
const USE_LOGIN_GUARD = false; // true면 토큰 없으면 login으로

if (USE_LOGIN_GUARD) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
  }
}

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

// 업로드 된 파일
let selectedFile = null;

// ------------------------------
// 유틸: 제목 길이 / 버튼 상태
// ------------------------------
function updateTitleLength() {
  const len = titleInput.value.length;
  titleLengthEl.textContent = `${len} / 26`;
}

function isFormValid() {
  const titleOk = titleInput.value.trim().length > 0;
  const contentOk = contentInput.value.trim().length > 0;
  return titleOk && contentOk;
}

function updateButtonStyle() {
  if (isFormValid()) {
    submitBtn.classList.add("enabled"); // 7F6AEE
  } else {
    submitBtn.classList.remove("enabled"); // ACA0EB
  }
}

// ------------------------------
// 게시글 생성 요청
// ------------------------------
async function createPost() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  // 제목/내용이 비어있으면 요구사항대로 안내
  if (!title || !content) {
    alert("*제목, 내용을 모두 작성해주세요");
    return;
  }

  if (USE_MOCK_CREATE) {
    // 더미 모드: 콘솔 출력 후 임의 postId로 상세페이지 이동
    const dummyNewPostId = Date.now(); // 임시 ID
    console.log("새 게시글 생성(더미 모드):", {
      id: dummyNewPostId,
      title,
      content,
      file: selectedFile,
    });

    alert("개발용: 게시글이 등록되었다고 가정하고 상세 페이지로 이동합니다.");
    window.location.href = `./post-detail.html?postId=${dummyNewPostId}`;
    return;
  }

  // 실제 API 연결
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    // 이미지가 포함되므로 FormData 사용 (multipart/form-data)
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    const res = await fetch("http://localhost:8080/board/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Content-Type 은 FormData 사용 시 자동 설정
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "게시글 등록에 실패했습니다.");
      return;
    }

    // 백엔드가 새로 생성된 게시글 id를 내려준다고 가정
    const newPostId = data.id;
    alert("게시글이 등록되었습니다.");
    window.location.href = `./post-detail.html?postId=${newPostId}`;
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  }
}

// ------------------------------
// 이벤트 바인딩
// ------------------------------
backBtn.addEventListener("click", () => {
  // 게시글 목록 페이지로
  window.location.href = "./posts.html";
});

titleInput.addEventListener("input", () => {
  // 26자 초과 방지(혹시 모를 붙여넣기 대비)
  if (titleInput.value.length > 26) {
    titleInput.value = titleInput.value.slice(0, 26);
  }
  updateTitleLength();
  updateButtonStyle();
});

contentInput.addEventListener("input", () => {
  updateButtonStyle();
});

imageInput.addEventListener("change", (e) => {
  const files = e.target.files;
  if (!files || !files.length) {
    selectedFile = null;
    fileNameText.textContent = "파일을 선택해주세요.";
    return;
  }

  // 이미지 1개만 업로드
  selectedFile = files[0];
  fileNameText.textContent = selectedFile.name;
});

submitBtn.addEventListener("click", createPost);

// ------------------------------
// 초기 상태 세팅
// ------------------------------
updateTitleLength();
updateButtonStyle();
fileNameText.textContent = "파일을 선택해주세요.";
