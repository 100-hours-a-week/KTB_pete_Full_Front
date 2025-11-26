import { initHeader } from "./header.js";
import {
  fetchPostDetail,
  togglePostLike,
  deletePostApi,
} from "./post-detail-api.js";
import { createCommentModule } from "./post-detail-comments.js";
import { throttle } from "./utils.js";
import { formatDateTime } from "./date-utils.js";
import { ensureActionAuth, handleAuthError } from "./auth.js";
import { showToast } from "./utils.js";
initHeader();

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

// DOM 요소들
const backBtn = document.getElementById("back-btn");
const postTitleEl = document.getElementById("post-title");
const postAuthorNameEl = document.getElementById("post-author-name");
const postCreatedAtEl = document.getElementById("post-created-at");
const postContentEl = document.getElementById("post-content");
const postImageTag = document.getElementById("post-image-tag");
const postAuthorAvatarEl = document.getElementById("post-author-avatar");

const likeBtn = document.getElementById("like-btn");
const likeCountEl = document.getElementById("like-count");
const viewCountEl = document.getElementById("view-count");
const commentCountEl = document.getElementById("comment-count");

const commentInputEl = document.getElementById("comment-input");
const submitCommentBtn = document.getElementById("submit-comment-btn");
const commentListEl = document.getElementById("comment-list");

const editPostBtn = document.getElementById("edit-post-btn");
const deletePostBtn = document.getElementById("delete-post-btn");
const postDeleteModal = document.getElementById("post-delete-modal");
const commentDeleteModal = document.getElementById("comment-delete-modal");
const cancelPostDeleteBtn = document.getElementById("cancel-post-delete-btn");
const confirmPostDeleteBtn = document.getElementById("confirm-post-delete-btn");
const cancelCommentDeleteBtn = document.getElementById(
  "cancel-comment-delete-btn"
);
const confirmCommentDeleteBtn = document.getElementById(
  "confirm-comment-delete-btn"
);

let isLiked = false;

function formatCount(count) {
  const n = Number(count) || 0;
  if (n >= 100000) return "100k";
  if (n >= 10000) return "10k";
  if (n >= 1000) return "1k";
  return String(n);
}

// 댓글 모듈 초기화
const commentModule = createCommentModule({
  postId,
  commentListEl,
  commentInputEl,
  submitBtn: submitCommentBtn,
  commentCountEl,
  formatCount,
});

// UI 관련 간단 함수들만 여기에
function updateLikeButtonStyle() {
  likeBtn.classList.remove("enabled", "disabled");
  likeBtn.classList.add(isLiked ? "enabled" : "disabled");
}

// 초기 데이터 로딩
async function initPage() {
  try {
    const detail = await fetchPostDetail(postId);

    postTitleEl.textContent = detail.title;
    postAuthorNameEl.textContent = detail.author;
    postCreatedAtEl.textContent = formatDateTime(detail.createdAt);
    postContentEl.textContent = detail.content;

    if (postAuthorAvatarEl) {
      postAuthorAvatarEl.src =
        detail.authorProfileImageUrl || DEFAULT_PROFILE_IMG;
    }    

    isLiked = detail.isLiked;
    likeCountEl.textContent = formatCount(detail.likeCount);
    viewCountEl.textContent = formatCount(detail.viewCount);
    commentModule.setTotalCommentCount(detail.commentCount);

    if (detail.imageUrl) {
      postImageTag.src = detail.imageUrl;
      postImageTag.classList.remove("hidden");
    } else {
      postImageTag.src = "";
      postImageTag.classList.add("hidden");
    }

    updateLikeButtonStyle();
    await commentModule.loadMore();
  } catch (error) {
    console.error(error);
    if (handleAuthError(error, { fallbackMessage: "게시글을 불러오지 못했습니다." })) {
      return;
    }
  }
}

// 뒤로가기
backBtn.addEventListener("click", () => {
  window.location.href = "./posts.html";
});

// 좋아요
likeBtn.addEventListener("click", async () => {
  if (!ensureActionAuth()) return;

  try {
    const result = await togglePostLike(postId, isLiked);
    isLiked = result.isLiked;
    likeCountEl.textContent = formatCount(result.likeCount);
    updateLikeButtonStyle();
  } catch (error) {
    console.error(error);
    if (handleAuthError(error, { fallbackMessage: "좋아요 처리에 실패했습니다." })) {
      return;
    }
  }
});

// 댓글 입력/등록
commentInputEl.addEventListener("input", () => {
  const hasText = commentInputEl.value.trim().length > 0;
  submitCommentBtn.disabled = !hasText;
  submitCommentBtn.classList.toggle("disabled", !hasText);
});

submitCommentBtn.addEventListener("click", async () => {
  if (!ensureActionAuth()) return;

  try {
    await commentModule.submit();
  } catch (error) {
    console.error(error);
    if (handleAuthError(error, { fallbackMessage: "댓글 처리에 실패했습니다." })) {
      return;
    }
  }
});

// 게시글 수정/삭제
editPostBtn.addEventListener("click", () => {
  window.location.href = `./post-edit.html?postId=${postId}`;
});

deletePostBtn.addEventListener("click", () => {
  postDeleteModal.classList.remove("hidden");
});

cancelPostDeleteBtn.addEventListener("click", () => {
  postDeleteModal.classList.add("hidden");
});

confirmPostDeleteBtn.addEventListener("click", async () => {
  if (!ensureActionAuth()) return;

  try {
    await deletePostApi(postId);
    window.location.href = "./posts.html";
  } catch (error) {
    console.error(error);
    if (handleAuthError(error, { fallbackMessage: "게시글 삭제에 실패했습니다." })) {
      return;
    }
  }
});

// 댓글 삭제 모달
cancelCommentDeleteBtn.addEventListener("click", () => {
  commentDeleteModal.classList.add("hidden");
});

confirmCommentDeleteBtn.addEventListener("click", async () => {
  if (!ensureActionAuth()) return;

  try {
    await commentModule.confirmDelete();
    commentDeleteModal.classList.add("hidden");
  } catch (error) {
    console.error(error);
    if (handleAuthError(error, { fallbackMessage: "댓글 삭제에 실패했습니다." })) {
      return;
    }
  }
});

// 스크롤 이벤트에서 댓글 더 불러오기
const handleScroll = throttle(() => {
  const scrollPosition = window.scrollY + window.innerHeight;
  const threshold = document.body.offsetHeight - 150;

  if (scrollPosition >= threshold) {
    commentModule.loadMore();
  }
}, 200);

window.addEventListener("scroll", handleScroll);

initPage();
