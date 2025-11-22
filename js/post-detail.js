// js/post-detail.js
import { initHeader } from "./header.js";
import { apiFetch, resolveImageUrl } from "./api-fetch.js";

initHeader();

// ------------------------------
// 플래그
// ------------------------------
const USE_MOCK_DETAIL = false;
const USE_LOGIN_GUARD = false;

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
  alert("잘못된 접근입니다. 게시글 ID가 없습니다.");
  window.location.href = "./posts.html";
}

// ------------------------------
// DOM
// ------------------------------
const backBtn = document.getElementById("back-btn");
const postTitleEl = document.getElementById("post-title");
const postAuthorNameEl = document.getElementById("post-author-name");
const postCreatedAtEl = document.getElementById("post-created-at");
const postContentEl = document.getElementById("post-content");
const postImageTag = document.getElementById("post-image-tag");

const likeBtn = document.getElementById("like-btn");
const likeCountEl = document.getElementById("like-count");
const viewCountEl = document.getElementById("view-count");
const commentCountEl = document.getElementById("comment-count");

const commentInputEl = document.getElementById("comment-input");
const submitCommentBtn = document.getElementById("submit-comment-btn");
const commentListEl = document.getElementById("comment-list");

const editPostBtn = document.getElementById("edit-post-btn");
const deletePostBtn = document.getElementById("delete-post-btn");

// 모달
const postDeleteModal = document.getElementById("post-delete-modal");
const commentDeleteModal = document.getElementById("comment-delete-modal");
const cancelPostDeleteBtn = document.getElementById("cancel-post-delete-btn");
const confirmPostDeleteBtn = document.getElementById(
  "confirm-post-delete-btn"
);
const cancelCommentDeleteBtn = document.getElementById(
  "cancel-comment-delete-btn"
);
const confirmCommentDeleteBtn = document.getElementById(
  "confirm-comment-delete-btn"
);

// ------------------------------
// 상태
// ------------------------------
let currentLikeCount = 0;
let isLiked = false;
let currentViewCount = 0;
let totalCommentCount = 0;

let loadedComments = [];
let commentPage = 0;
let commentPageSize = 10;
let commentLastPage = false;
let commentLoading = false;
let commentTotalPages = null;

let editingCommentId = null;
let deletingCommentId = null;

// ------------------------------
// 유틸
// ------------------------------
function formatDateTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function formatCount(count) {
  const n = Number(count) || 0;
  if (n >= 100000) return "100k";
  if (n >= 10000) return "10k";
  if (n >= 1000) return "1k";
  return String(n);
}

// ------------------------------
// 게시글 상세
// ------------------------------
async function loadPostDetail() {
  if (USE_MOCK_DETAIL) {
    return; // 지금은 실제 API만 사용
  }

  try {
    const detail = await apiFetch(
      `/board/posts/${encodeURIComponent(postId)}`,
      {
        method: "GET",
        includeAuth: false,
      }
    );

    const mapped = {
      id: detail.id,
      title: detail.title,
      author: detail.writerNickname ?? "작성자",
      createdAt: detail.createdAt,
      content: detail.content,
      imageUrl: detail.image, // 백엔드에서 /uploads/... 형태로 내려줌
      likeCount: Number(detail.likes ?? 0),
      isLiked: detail.liked ?? false,
      viewCount: Number(detail.views ?? 0),
      commentCount: Number(detail.comments ?? 0),
    };

    renderPostDetail(mapped);
  } catch (err) {
    console.error(err);
    alert(err.message || "게시글을 불러오지 못했습니다.");
  }
}

function renderPostDetail(detail) {
  postTitleEl.textContent = detail.title;
  postAuthorNameEl.textContent = detail.author;
  postCreatedAtEl.textContent = formatDateTime(detail.createdAt);
  postContentEl.textContent = detail.content;

  currentLikeCount = detail.likeCount ?? 0;
  isLiked = detail.isLiked ?? false;
  currentViewCount = detail.viewCount ?? 0;
  totalCommentCount = detail.commentCount ?? 0;

  likeCountEl.textContent = formatCount(currentLikeCount);
  viewCountEl.textContent = formatCount(currentViewCount);
  commentCountEl.textContent = formatCount(totalCommentCount);

  if (detail.imageUrl) {
    postImageTag.src = resolveImageUrl(detail.imageUrl);
    postImageTag.classList.remove("hidden");
  } else {
    postImageTag.src = "";
    postImageTag.classList.add("hidden");
  }

  updateLikeButtonStyle();
}

// ------------------------------
// 좋아요
// ------------------------------
function updateLikeButtonStyle() {
  likeBtn.classList.remove("enabled", "disabled");
  if (isLiked) {
    likeBtn.classList.add("enabled");
  } else {
    likeBtn.classList.add("disabled");
  }
}

async function toggleLike() {
  if (USE_MOCK_DETAIL) return;

  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
    return;
  }

  try {
    const result = await apiFetch(
      `/board/posts/${encodeURIComponent(postId)}/likes`,
      {
        method: isLiked ? "DELETE" : "POST",
      }
    );

    isLiked = result.liked;
    currentLikeCount = Number(result.likeCount ?? 0);
    likeCountEl.textContent = formatCount(currentLikeCount);
    updateLikeButtonStyle();
  } catch (err) {
    console.error(err);
    alert(err.message || "좋아요 처리에 실패했습니다.");
  }
}

// ------------------------------
// 댓글 렌더링
// ------------------------------
function createCommentCard(comment) {
  const { id, author, createdAt, content } = comment;

  const card = document.createElement("div");
  card.className = "comment-card";
  card.dataset.commentId = id;

  card.innerHTML = `
    <div class="comment-avatar"></div>
    <div class="comment-body">
      <div class="comment-header-line">
        <div>
          <span class="comment-author">${author}</span>
          <span class="comment-date"> · ${formatDateTime(createdAt)}</span>
        </div>
      </div>
      <p class="comment-text">${content}</p>
      <div class="comment-action-buttons">
        <button class="comment-action-btn edit-btn" type="button">수정</button>
        <button class="comment-action-btn danger delete-btn" type="button">삭제</button>
      </div>
    </div>
  `;

  const editBtn = card.querySelector(".edit-btn");
  editBtn.addEventListener("click", () => {
    editingCommentId = id;
    commentInputEl.value = content;
    submitCommentBtn.textContent = "댓글 수정";
    submitCommentBtn.disabled = false;
    submitCommentBtn.classList.remove("disabled");
  });

  const deleteBtn = card.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    deletingCommentId = id;
    openModal(commentDeleteModal);
  });

  return card;
}

function appendComments(comments) {
  comments.forEach((c) => {
    loadedComments.push(c);
    const card = createCommentCard(c);
    commentListEl.appendChild(card);
  });
}

// ------------------------------
// 댓글 조회 (인피니트 스크롤)
// ------------------------------
async function loadComments(page) {
  if (commentLoading || commentLastPage) return;
  commentLoading = true;

  try {
    const params = new URLSearchParams({
      page: String(page),
      size: String(commentPageSize),
      dir: "desc",
    });

    const result = await apiFetch(
      `/board/posts/${encodeURIComponent(postId)}/comments?${params.toString()}`,
      { method: "GET", includeAuth: false }
    );

    const items = Array.isArray(result.items) ? result.items : [];
    const mapped = items.map((c) => ({
      id: c.id,
      author: c.writerNickname ?? "작성자",
      createdAt: c.createdAt,
      content: c.content,
    }));

    appendComments(mapped);

    const pageInfo = result.page;
    if (pageInfo) {
      commentPage = pageInfo.page;
      commentPageSize = pageInfo.size;
      commentTotalPages = pageInfo.totalPages;
      if (commentPage >= commentTotalPages - 1) {
        commentLastPage = true;
      }
    }
  } catch (err) {
    console.error(err);
    alert(err.message || "댓글을 불러오지 못했습니다.");
  } finally {
    commentLoading = false;
  }
}

function handleScroll() {
  if (commentLoading || commentLastPage) return;

  const scrollPosition = window.scrollY + window.innerHeight;
  const threshold = document.body.offsetHeight - 150;
  if (scrollPosition >= threshold) {
    loadComments(commentPage + 1);
  }
}

// ------------------------------
// 댓글 등록 / 수정
// ------------------------------
async function submitComment() {
  const text = commentInputEl.value.trim();
  if (!text) return;

  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
    return;
  }

  try {
    if (editingCommentId == null) {
      const result = await apiFetch(
        `/board/posts/${encodeURIComponent(postId)}/comments`,
        {
          method: "POST",
          body: { content: text },
        }
      );

      const newComment = {
        id: result.id,
        author: result.writerNickname ?? "작성자",
        createdAt: result.createdAt,
        content: result.content,
      };

      loadedComments.unshift(newComment);
      commentListEl.prepend(createCommentCard(newComment));
      totalCommentCount += 1;
      commentCountEl.textContent = formatCount(totalCommentCount);
    } else {
      const result = await apiFetch(
        `/board/posts/${encodeURIComponent(
          postId
        )}/comments/${encodeURIComponent(editingCommentId)}`,
        {
          method: "PATCH",
          body: { content: text },
        }
      );

      const updated = {
        id: result.id,
        author: result.writerNickname ?? "작성자",
        createdAt: result.createdAt,
        content: result.content,
      };

      const idx = loadedComments.findIndex(
        (c) => c.id === editingCommentId
      );
      if (idx !== -1) {
        loadedComments[idx] = updated;
      }

      const card = commentListEl.querySelector(
        `[data-comment-id="${editingCommentId}"]`
      );
      if (card) {
        const textEl = card.querySelector(".comment-text");
        textEl.textContent = updated.content;
      }
    }

    editingCommentId = null;
    commentInputEl.value = "";
    submitCommentBtn.textContent = "댓글 등록";
    submitCommentBtn.disabled = true;
    submitCommentBtn.classList.add("disabled");
  } catch (err) {
    console.error(err);
    alert(err.message || "댓글 처리에 실패했습니다.");
  }
}

// ------------------------------
// 댓글 삭제
// ------------------------------
async function deleteComment() {
  if (deletingCommentId == null) return;

  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
    return;
  }

  try {
    await apiFetch(
      `/board/posts/${encodeURIComponent(
        postId
      )}/comments/${encodeURIComponent(deletingCommentId)}`,
      { method: "DELETE" }
    );

    loadedComments = loadedComments.filter((c) => c.id !== deletingCommentId);
    const card = commentListEl.querySelector(
      `[data-comment-id="${deletingCommentId}"]`
    );
    if (card) card.remove();

    totalCommentCount = Math.max(0, totalCommentCount - 1);
    commentCountEl.textContent = formatCount(totalCommentCount);
    deletingCommentId = null;
    closeModal(commentDeleteModal);
  } catch (err) {
    console.error(err);
    alert(err.message || "댓글 삭제에 실패했습니다.");
  }
}

// ------------------------------
// 게시글 삭제
// ------------------------------
async function deletePost() {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
    return;
  }

  try {
    await apiFetch(`/board/posts/${encodeURIComponent(postId)}`, {
      method: "DELETE",
    });

    closeModal(postDeleteModal);
    window.location.href = "./posts.html";
  } catch (err) {
    console.error(err);
    alert(err.message || "게시글 삭제에 실패했습니다.");
  }
}

// ------------------------------
// 모달 유틸
// ------------------------------
function openModal(modalEl) {
  modalEl.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal(modalEl) {
  modalEl.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

// ------------------------------
// 이벤트 바인딩
// ------------------------------
backBtn.addEventListener("click", () => {
  window.location.href = "./posts.html";
});

likeBtn.addEventListener("click", toggleLike);

commentInputEl.addEventListener("input", () => {
  const hasText = commentInputEl.value.trim().length > 0;
  submitCommentBtn.disabled = !hasText;
  if (hasText) {
    submitCommentBtn.classList.remove("disabled");
  } else {
    submitCommentBtn.classList.add("disabled");
  }
});

submitCommentBtn.addEventListener("click", submitComment);

editPostBtn.addEventListener("click", () => {
  window.location.href = `./post-edit.html?postId=${postId}`;
});

deletePostBtn.addEventListener("click", () => {
  openModal(postDeleteModal);
});

cancelPostDeleteBtn.addEventListener("click", () => {
  closeModal(postDeleteModal);
});

confirmPostDeleteBtn.addEventListener("click", deletePost);

cancelCommentDeleteBtn.addEventListener("click", () => {
  deletingCommentId = null;
  closeModal(commentDeleteModal);
});

confirmCommentDeleteBtn.addEventListener("click", deleteComment);

window.addEventListener("scroll", handleScroll);

// ------------------------------
// 초기 로딩
// ------------------------------
loadPostDetail();
loadComments(0);
