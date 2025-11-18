// js/post-edit.js

// ------------------------------
// 개발 플래그
// ------------------------------
const USE_MOCK_EDIT = true; // true면 더미 데이터로만 동작
const USE_LOGIN_GUARD = false;

if (USE_LOGIN_GUARD) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
  }
}

// ------------------------------
// postId
// ------------------------------
function getPostIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("postId");
  return id ? Number(id) : null;
}

const postId = getPostIdFromQuery() ?? 1;

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

// 현재 파일
let selectedFile = null;

// ------------------------------
// 더미 기존 게시글 데이터 (상세 페이지와 동일 값)
// ------------------------------
const mockExistingPost = {
  id: postId,
  title: "제목 1",
  content:
    "무엇을 얘기할까요? 아무말이라면, 실은 항상 놀라운 모험이라고 생각합니다. 우리는 매일 새로운 경험을 하고 매번 성장합니다. 때로는 어려움과 도전이 있지만, 그것들이 우리를 더 강하고 지혜롭게 만듭니다. 또한 우리는 주변의 사람들과 연결되며 사랑과 지지를 받습니다. 그래서 우리의 삶은 소중하고 의미가 있습니다.\n\n자연도 아름다운 이야기입니다. 우리 주변의 자연은 끝없는 아름다움과 신비로움을 담고 있습니다. 바다, 산, 하늘 등 모든 곳에 우리의 관심과 감탄을 불러일으킵니다. 자연은 우리의 일상 속 안정과 치유의 힘을 주며, 우리는 그 안에서 위로를 찾곤 합니다.",
  imageUrl: "../img/post-dummy.png", // 상세 페이지와 동일
};

// ------------------------------
// 유틸
// ------------------------------
function updateTitleLength() {
  const len = titleInput.value.length;
  titleLength.textContent = `${len} / 26`;
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
}

// ------------------------------
// 기존 데이터 불러오기
// ------------------------------
async function loadExistingPost() {
  if (USE_MOCK_EDIT) {
    applyExistingPost(mockExistingPost);
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:8080/board/posts/${encodeURIComponent(postId)}`
    );
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "게시글 정보를 불러오지 못했습니다.");
      return;
    }

    const existing = {
      id: data.id,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
    };
    applyExistingPost(existing);
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  }
}

function applyExistingPost(post) {
  titleInput.value = post.title ?? "";
  contentInput.value = post.content ?? "";
  fileNameText.textContent = "기존 파일 명";

  updateTitleLength();
  validateForm();
}

// ------------------------------
// 수정 요청
// ------------------------------
async function submitEdit() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return;

  if (USE_MOCK_EDIT) {
    console.log("수정 요청(더미):", {
      postId,
      title,
      content,
      selectedFile,
    });
    alert("개발용: 수정된 것으로 가정하고 상세 페이지로 이동합니다.");
    window.location.href = `./post-detail.html?postId=${postId}`;
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    // 이미지 파일 포함이므로 FormData 사용 (multipart/form-data)
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    const res = await fetch(
      `http://localhost:8080/board/posts/${encodeURIComponent(postId)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type 은 FormData 사용 시 브라우저가 자동 설정
        },
        body: formData,
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "게시글 수정에 실패했습니다.");
      return;
    }

    alert("게시글이 수정되었습니다.");
    window.location.href = `./post-detail.html?postId=${postId}`;
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  }
}

// ------------------------------
// 이벤트 바인딩
// ------------------------------
backBtn.addEventListener("click", () => {
  window.location.href = `./post-detail.html?postId=${postId}`;
});

titleInput.addEventListener("input", () => {
  // maxlength=26 이라서 27자 이상 입력 자체가 안 되지만
  // 혹시 모를 붙여넣기 등 대비해서 한 번 더 잘라줌
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
    fileNameText.textContent = "기존 파일 명";
    return;
  }

  // 이미지 1개만
  selectedFile = files[0];
  fileNameText.textContent = selectedFile.name;
});

submitBtn.addEventListener("click", submitEdit);

// ------------------------------
// 초기 로딩
// ------------------------------
loadExistingPost();
