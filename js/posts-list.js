// js/posts-list.js
import { initHeader } from "./header.js";
import { apiFetch } from "./api-fetch.js";
import { formatDateTime } from "./date-utils.js";
import { showToast } from "./utils.js";

initHeader();

// ------------------------------
// DOM
// ------------------------------
const postTableEl = document.getElementById("post-table");
const emptyTextEl = document.getElementById("list-empty-text");
const pageInfoEl = document.getElementById("page-info");
const prevPageBtn = document.getElementById("prev-page-btn");
const nextPageBtn = document.getElementById("next-page-btn");
const goWriteBtn = document.getElementById("go-write-btn");
const goMainBtn = document.getElementById("go-main-btn");
const sortLatestBtn = document.getElementById("sort-latest-btn");
const sortLikesBtn = document.getElementById("sort-likes-btn");

// ------------------------------
// 상수 & 상태
// ------------------------------
const PAGE_SIZE = 10;

let currentPage = 0;       // 백엔드 page가 0부터라고 가정
let pageSize = PAGE_SIZE;
let totalPages = 1;
let isLoading = false;
let currentSort = "latest"; // 'latest' | 'likes'

// ------------------------------
// 렌더링
// ------------------------------
function renderPosts(posts) {
  postTableEl.innerHTML = "";

  if (!posts || posts.length === 0) {
    emptyTextEl.classList.remove("hidden");
    return;
  }

  emptyTextEl.classList.add("hidden");

  posts.forEach((post) => {
    const {
      id,
      title,
      writerNickname,
      likes,
      comments,
      views,
      createdAt,
    } = post;

    const li = document.createElement("li");
    li.className = "post-row";

    const titleEl = document.createElement("div");
    titleEl.className = "post-row-title";
    titleEl.textContent = title ?? "(제목 없음)";

    const metaEl = document.createElement("div");
    metaEl.className = "post-row-meta";
    const likeCount = Number(likes ?? 0);
    const commentCount = Number(comments ?? 0);
    const viewCount = Number(views ?? 0);
    const nickname = writerNickname ?? "작성자";

    metaEl.textContent = `${nickname} · 좋아요 ${likeCount} · 댓글 ${commentCount} · 조회수 ${viewCount}`;

    const dateEl = document.createElement("div");
    dateEl.className = "post-row-date";
    dateEl.textContent = formatDateTime(createdAt);

    li.appendChild(titleEl);
    li.appendChild(metaEl);
    li.appendChild(dateEl);

    li.addEventListener("click", () => {
      if (!id) return;
      window.location.href = `./post-detail.html?postId=${id}`;
    });

    postTableEl.appendChild(li);
  });
}

function renderPagination() {
  pageInfoEl.textContent = `${currentPage + 1} / ${totalPages} 페이지`;

  prevPageBtn.disabled = currentPage <= 0;
  nextPageBtn.disabled = currentPage >= totalPages - 1;
}

// ------------------------------
// API 통신
// ------------------------------
function getSortParams() {
  if (currentSort === "likes") {
    return { sort: "likes", dir: "desc" };
  }
  // default 최신순
  return { sort: "createdAt", dir: "desc" };
}

async function fetchPostList(page) {
  if (isLoading) return;
  isLoading = true;

  const { sort, dir } = getSortParams();

  const params = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
    sort,
    dir,
  });

  try {
    const result = await apiFetch(`/board/posts?${params.toString()}`, {
      method: "GET",
      includeAuth: false,
    });

    const items = Array.isArray(result.items) ? result.items : [];
    const pageInfo = result.page || {};

    currentPage = typeof pageInfo.page === "number" ? pageInfo.page : page;
    pageSize = typeof pageInfo.size === "number" ? pageInfo.size : pageSize;
    totalPages =
      typeof pageInfo.totalPages === "number" ? pageInfo.totalPages : 1;

    renderPosts(items);
    renderPagination();
  } catch (err) {
    console.error("게시글 목록 조회 실패:", err);
    showToast(err.message || "게시글 목록을 불러오지 못했습니다.");
  } finally {
    isLoading = false;
  }
}

// ------------------------------
// 이벤트
// ------------------------------
if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage <= 0) return;
    fetchPostList(currentPage - 1);
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    if (currentPage >= totalPages - 1) return;
    fetchPostList(currentPage + 1);
  });
}

if (goWriteBtn) {
  goWriteBtn.addEventListener("click", () => {
    window.location.href = "./post-create.html";
  });
}

if (goMainBtn) {
  goMainBtn.addEventListener("click", () => {
    window.location.href = "./posts.html";
  });
}

if (sortLatestBtn) {
  sortLatestBtn.addEventListener("click", () => {
    if (currentSort === "latest") return;
    currentSort = "latest";
    sortLatestBtn.classList.add("active");
    sortLikesBtn.classList.remove("active");
    fetchPostList(0);
  });
}

if (sortLikesBtn) {
  sortLikesBtn.addEventListener("click", () => {
    if (currentSort === "likes") return;
    currentSort = "likes";
    sortLikesBtn.classList.add("active");
    sortLatestBtn.classList.remove("active");
    fetchPostList(0);
  });
}

// ------------------------------
// 초기 로딩
// ------------------------------
fetchPostList(0);
