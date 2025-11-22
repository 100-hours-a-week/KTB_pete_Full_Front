// js/posts.js
import { initHeader } from "./header.js";
import { apiFetch } from "./api-fetch.js";

initHeader();

// ------------------------------
// 플래그
// ------------------------------
const USE_MOCK_POSTS = false;

// ------------------------------
// DOM
// ------------------------------
const postListEl = document.getElementById("post-list");
const emptyTextEl = document.getElementById("empty-text");
const goWriteBtn = document.getElementById("go-write-btn");

// ------------------------------
// 상태
// ------------------------------
let currentPage = 0;
let pageSize = 10;
let isLastPage = false;
let isLoading = false;

// ------------------------------
// 더미 (원할 때만 사용)
// ------------------------------
const mockPosts = [
  {
    id: 1,
    title: "제목 1",
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: "2021-01-01T00:00:00",
    writerNickname: "더미 작성자 1",
  },
  {
    id: 2,
    title: "제목 2",
    likeCount: 3,
    commentCount: 1,
    viewCount: 10,
    createdAt: "2021-01-02T00:00:00",
    writerNickname: "더미 작성자 2",
  },
];

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

// 카드 생성
function createPostCard(post) {
  const {
    id,
    title,
    createdAt,
    writerNickname,
    likes,
    comments,
    views,
  } = post;

  const actualId = id;
  const postTitle = title ?? "(제목 없음)";
  const authorName = writerNickname ?? "작성자";
  const like = Number(likes ?? 0);
  const comment = Number(comments ?? 0);
  const view = Number(views ?? 0);

  const card = document.createElement("article");
  card.className = "post-card";

  card.innerHTML = `
    <div class="post-header">
      <div>
        <p class="post-title">${postTitle}</p>
        <p class="post-meta-top">
          <span class="post-stats">
            좋아요 ${like} ㆍ 댓글 ${comment} ㆍ 조회수 ${view}
          </span>
        </p>
      </div>
      <p class="post-date">${formatDateTime(createdAt)}</p>
    </div>

    <div class="post-footer">
      <div class="post-author-avatar"></div>
      <p class="post-author-name">${authorName}</p>
    </div>
  `;

  card.addEventListener("click", () => {
    if (!actualId) return;
    window.location.href = `./post-detail.html?postId=${actualId}`;
  });

  return card;
}

function appendPosts(posts) {
  if (!posts.length && currentPage === 0) {
    emptyTextEl.classList.remove("hidden");
    return;
  }

  emptyTextEl.classList.add("hidden");

  posts.forEach((post) => {
    const card = createPostCard(post);
    postListEl.appendChild(card);
  });
}

// ------------------------------
// 게시글 조회
// ------------------------------
async function fetchPosts(page) {
  if (USE_MOCK_POSTS) {
    appendPosts(mockPosts);
    isLastPage = true;
    return;
  }

  if (isLoading || isLastPage) return;
  isLoading = true;

  const params = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
    sort: "createdAt",
    dir: "desc",
  });

  try {
    const result = await apiFetch(`/board/posts?${params.toString()}`, {
      method: "GET",
      includeAuth: false, // 비로그인도 목록 조회 가능
    });

    const items = Array.isArray(result.items) ? result.items : [];
    const pageInfo = result.page || {};

    appendPosts(items);

    currentPage =
      typeof pageInfo.page === "number" ? pageInfo.page : page;
    pageSize =
      typeof pageInfo.size === "number" ? pageInfo.size : pageSize;

    const totalPages =
      typeof pageInfo.totalPages === "number" ? pageInfo.totalPages : null;

    if (totalPages !== null && currentPage >= totalPages - 1) {
      isLastPage = true;
    }

    if (currentPage === 0 && items.length === 0) {
      emptyTextEl.classList.remove("hidden");
    }
  } catch (err) {
    console.error("게시글 조회 실패:", err);
    alert(err.message || "게시글을 불러오지 못했습니다.");
  } finally {
    isLoading = false;
  }
}

// ------------------------------
// 인피니트 스크롤
// ------------------------------
function handleScroll() {
  if (USE_MOCK_POSTS) return;
  if (isLoading || isLastPage) return;

  const { scrollTop, scrollHeight, clientHeight } = postListEl;
  const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

  if (isNearBottom) {
    fetchPosts(currentPage + 1);
  }
}

postListEl.addEventListener("scroll", handleScroll);

// ------------------------------
// 글쓰기 버튼
// ------------------------------
if (goWriteBtn) {
  goWriteBtn.addEventListener("click", () => {
    window.location.href = "./post-create.html";
  });
}

// ------------------------------
// 초기 로딩
// ------------------------------
fetchPosts(0);
