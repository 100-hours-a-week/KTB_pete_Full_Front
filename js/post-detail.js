// js/post-detail.js
import { initHeader } from "./header.js";

initHeader();

// ------------------------------
// 개발 플래그
// ------------------------------
const USE_MOCK_DETAIL = true; // true: 더미 데이터 사용, false: 실제 API 사용
const USE_LOGIN_GUARD = false; // true면 토큰 없을 때 login.html로 튕김

if (USE_LOGIN_GUARD) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인 후 이용해주세요.");
    window.location.href = "./login.html";
  }
}

// ------------------------------
// 유틸: 쿼리 파라미터에서 postId 추출
// ------------------------------
function getPostIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("postId");
  return id ? Number(id) : null;
}

const postId = getPostIdFromQuery() ?? 1; // 없으면 1로 가정 (개발용)

// ------------------------------
// 더미 데이터
// ------------------------------
const mockPostDetail = {
  id: postId,
  title: "제목 1",
  author: "더미 작성자 1",
  createdAt: "2021-01-01T00:00:00",
  content:
    "무엇을 얘기할까요? 아무말이라면, 실은 항상 불편한 말일이라 생각합니다. 우리는 매일 새로운 경험을 하고 매번 성장합니다. 때로는 어려움을 겪으며 아플 때도 있지만, 그것들이 우리의 한 걸음을 내딛게 하는 동력이 되기도 합니다.\n\n우리는 언제나 주변과 관계 맺으며 살아가고, 때로는 그 안에서 작은 위로와 즐거움을 찾습니다.",
  imageUrl: "../img/dummy.png",
  likeCount: 123,
  isLiked: false,
  viewCount: 123,
  commentCount: 123,
};

// 댓글 더미 데이터
const mockCommentsPages = [
  [
    {
      id: 1,
      author: "더미 작성자 1",
      createdAt: "2021-01-01T00:00:00",
      content: "댓글 내용 1",
    },
    {
      id: 2,
      author: "더미 작성자 2",
      createdAt: "2021-01-01T00:00:00",
      content: "댓글 내용 2",
    },
    {
      id: 3,
      author: "더미 작성자 3",
      createdAt: "2021-01-01T00:00:00",
      content: "댓글 내용 3",
    },
  ],
  [
    {
      id: 4,
      author: "더미 작성자 4",
      createdAt: "2021-01-01T00:00:00",
      content: "댓글 내용 4",
    },
    {
      id: 5,
      author: "더미 작성자 5",
      createdAt: "2021-01-01T00:00:00",
      content: "댓글 내용 5",
    },
  ],
];

let loadedComments = [];

// ------------------------------
// DOM 요소
// ------------------------------
const backBtn = document.getElementById("back-btn");
const postTitleEl = document.getElementById("post-title");
const postAuthorNameEl = document.getElementById("post-author-name");
const postCreatedAtEl = document.getElementById("post-created-at");
const postContentEl = document.getElementById("post-content");
const postImageEl = document.getElementById("post-image");
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

// 모달 관련
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

// 현재 상태
let currentLikeCount = mockPostDetail.likeCount;
let isLiked = mockPostDetail.isLiked;
let currentViewCount = mockPostDetail.viewCount;
let totalCommentCount = mockPostDetail.commentCount;

// 댓글 인피니트 스크롤 상태
let commentPage = 0;
let commentPageSize = 5;
let commentLastPage = false;
let commentLoading = false;

// 현재 수정/삭제 중인 댓글
let editingCommentId = null;
let deletingCommentId = null;

// ------------------------------
// 유틸: 날짜/숫자 포맷
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
  if (count >= 100000) return "100k";
  if (count >= 10000) return "10k";
  if (count >= 1000) return "1k";
  return String(count);
}

// ------------------------------
// 게시글 상세 로딩
// ------------------------------
async function loadPostDetail() {
  if (USE_MOCK_DETAIL) {
    renderPostDetail(mockPostDetail);
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:8080/board/posts/${encodeURIComponent(postId)}`
    );
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "게시글을 불러오지 못했습니다.");
      return;
    }

    const detail = {
      id: data.id,
      title: data.title,
      author: data.writerNickname,
      createdAt: data.createdAt,
      content: data.content,
      imageUrl: data.imageUrl,
      likeCount: data.likeCount,
      isLiked: data.liked,
      viewCount: data.viewCount,
      commentCount: data.commentCount,
    };

    renderPostDetail(detail);
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
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
    postImageTag.src = detail.imageUrl;
    postImageTag.classList.remove("hidden");
  } else {
    postImageTag.src = "";
    postImageTag.classList.add("hidden");
  }

  updateLikeButtonStyle();
}

// ------------------------------
// 좋아요 버튼
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
  if (USE_MOCK_DETAIL) {
    if (isLiked) {
      isLiked = false;
      currentLikeCount = Math.max(0, currentLikeCount - 1);
    } else {
      isLiked = true;
      currentLikeCount += 1;
    }
    likeCountEl.textContent = formatCount(currentLikeCount);
    updateLikeButtonStyle();
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    const res = await fetch(
      `http://localhost:8080/board/posts/${encodeURIComponent(
        postId
      )}/like`,
      {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "좋아요 처리에 실패했습니다.");
      return;
    }

    if (isLiked) {
      isLiked = false;
      currentLikeCount = Math.max(0, currentLikeCount - 1);
    } else {
      isLiked = true;
      currentLikeCount += 1;
    }
    likeCountEl.textContent = formatCount(currentLikeCount);
    updateLikeButtonStyle();
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
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
// 댓글 로딩 (인피니티 스크롤)
// ------------------------------
async function loadComments(page) {
  if (commentLoading || commentLastPage) return;
  commentLoading = true;

  if (USE_MOCK_DETAIL) {
    const pageData = mockCommentsPages[page];
    if (!pageData) {
      commentLastPage = true;
      commentLoading = false;
      return;
    }
    appendComments(pageData);
    if (page >= mockCommentsPages.length - 1) {
      commentLastPage = true;
    }
    commentPage = page;
    commentLoading = false;
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:8080/board/posts/${encodeURIComponent(
        postId
      )}/comments?page=${page}&size=${commentPageSize}`
    );
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "댓글을 불러오지 못했습니다.");
      commentLoading = false;
      return;
    }

    const comments = Array.isArray(data.content) ? data.content : data.comments;
    appendComments(
      comments.map((c) => ({
        id: c.id,
        author: c.writerNickname,
        createdAt: c.createdAt,
        content: c.content,
      }))
    );

    commentLastPage = data.last;
    commentPage = data.number;
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  } finally {
    commentLoading = false;
  }
}

// 스크롤 이벤트
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

  if (USE_MOCK_DETAIL) {
    if (editingCommentId == null) {
      const newComment = {
        id: Date.now(),
        author: "나 (더미)",
        createdAt: new Date().toISOString(),
        content: text,
      };
      loadedComments.unshift(newComment);
      commentListEl.prepend(createCommentCard(newComment));
      totalCommentCount += 1;
      commentCountEl.textContent = formatCount(totalCommentCount);
    } else {
      const target = loadedComments.find((c) => c.id === editingCommentId);
      if (target) {
        target.content = text;
        const card = commentListEl.querySelector(
          `[data-comment-id="${editingCommentId}"]`
        );
        if (card) {
          const textEl = card.querySelector(".comment-text");
          textEl.textContent = text;
        }
      }
    }

    editingCommentId = null;
    commentInputEl.value = "";
    submitCommentBtn.textContent = "댓글 등록";
    submitCommentBtn.disabled = true;
    submitCommentBtn.classList.add("disabled");
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    if (editingCommentId == null) {
      const res = await fetch(
        `http://localhost:8080/board/posts/${encodeURIComponent(
          postId
        )}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "댓글 등록에 실패했습니다.");
        return;
      }

      const newComment = {
        id: data.id,
        author: data.writerNickname,
        createdAt: data.createdAt,
        content: data.content,
      };
      loadedComments.unshift(newComment);
      commentListEl.prepend(createCommentCard(newComment));
      totalCommentCount += 1;
      commentCountEl.textContent = formatCount(totalCommentCount);
    } else {
      const res = await fetch(
        `http://localhost:8080/board/comments/${encodeURIComponent(
          editingCommentId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "댓글 수정에 실패했습니다.");
        return;
      }

      const target = loadedComments.find((c) => c.id === editingCommentId);
      if (target) {
        target.content = text;
        const card = commentListEl.querySelector(
          `[data-comment-id="${editingCommentId}"]`
        );
        if (card) {
          const textEl = card.querySelector(".comment-text");
          textEl.textContent = text;
        }
      }
    }

    editingCommentId = null;
    commentInputEl.value = "";
    submitCommentBtn.textContent = "댓글 등록";
    submitCommentBtn.disabled = true;
    submitCommentBtn.classList.add("disabled");
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  }
}

// ------------------------------
// 댓글 삭제
// ------------------------------
async function deleteComment() {
  if (deletingCommentId == null) return;

  if (USE_MOCK_DETAIL) {
    loadedComments = loadedComments.filter((c) => c.id !== deletingCommentId);
    const card = commentListEl.querySelector(
      `[data-comment-id="${deletingCommentId}"]`
    );
    if (card) card.remove();
    totalCommentCount = Math.max(0, totalCommentCount - 1);
    commentCountEl.textContent = formatCount(totalCommentCount);
    deletingCommentId = null;
    closeModal(commentDeleteModal);
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    const res = await fetch(
      `http://localhost:8080/board/comments/${encodeURIComponent(
        deletingCommentId
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "댓글 삭제에 실패했습니다.");
      return;
    }

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
    alert("서버 오류가 발생했습니다.");
  }
}

// ------------------------------
// 게시글 삭제
// ------------------------------
async function deletePost() {
  if (USE_MOCK_DETAIL) {
    closeModal(postDeleteModal);
    alert("개발용: 게시글이 삭제되었다고 가정하고 목록으로 이동합니다.");
    window.location.href = "./posts.html";
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    const res = await fetch(
      `http://localhost:8080/board/posts/${encodeURIComponent(postId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "게시글 삭제에 실패했습니다.");
      return;
    }

    closeModal(postDeleteModal);
    window.location.href = "./posts.html";
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  }
}

// ------------------------------
// 모달 열고/닫기
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
