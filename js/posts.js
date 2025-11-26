import { initHeader } from "./header.js";
import { apiFetch, resolveImageUrl } from "./api-fetch.js";
import { throttle } from "./utils.js";
import { formatDateTime } from "./date-utils.js";
import { showToast } from "./utils.js";

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
// 상수
// ------------------------------
const PAGE_SIZE = 10;

// ------------------------------
// 상태
// ------------------------------
let currentPage = 0;
let pageSize = PAGE_SIZE;
let isLastPage = false;
let isLoading = false;

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
    writerProfileImage,
  } = post;

  const actualId = id;
  const postTitle = title ?? "(제목 없음)";
  const authorName = writerNickname ?? "작성자";
  const like = Number(likes ?? 0);
  const comment = Number(comments ?? 0);
  const view = Number(views ?? 0);

  const profileImageSrc = writerProfileImage
    ? resolveImageUrl(writerProfileImage)
    : DEFAULT_PROFILE_IMG;


  // <article class="post-card">
  const card = document.createElement("article");
  card.className = "post-card";

  // ----- 상단 헤더 -----
  const header = document.createElement("div");
  header.className = "post-header";

  const headerLeft = document.createElement("div");

  const titleEl = document.createElement("p");
  titleEl.className = "post-title";
  titleEl.textContent = postTitle;

  const metaTop = document.createElement("p");
  metaTop.className = "post-meta-top";

  const statsSpan = document.createElement("span");
  statsSpan.className = "post-stats";
  statsSpan.textContent = `좋아요 ${like} ㆍ 댓글 ${comment} ㆍ 조회수 ${view}`;

  metaTop.appendChild(statsSpan);
  headerLeft.appendChild(titleEl);
  headerLeft.appendChild(metaTop);

  const dateEl = document.createElement("p");
  dateEl.className = "post-date";
  dateEl.textContent = formatDateTime(createdAt);

  header.appendChild(headerLeft);
  header.appendChild(dateEl);

  // ----- 하단 푸터 -----
  const footer = document.createElement("div");
  footer.className = "post-footer";

  const avatar = document.createElement("img");
  avatar.className = "post-author-avatar";
  avatar.alt = `${authorName} 프로필`;
  avatar.src = profileImageSrc;

  const authorEl = document.createElement("p");
  authorEl.className = "post-author-name";
  authorEl.textContent = authorName;

  footer.appendChild(avatar);
  footer.appendChild(authorEl);

  // ----- 카드 조립 -----
  card.appendChild(header);
  card.appendChild(footer);

  // ----- 클릭 이벤트 -----
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
    showToast(err.message || "게시글을 불러오지 못했습니다.");
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

const throttledHandleScroll = throttle(handleScroll, 200);
postListEl.addEventListener("scroll", throttledHandleScroll);
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
