import { initHeader, DEFAULT_PROFILE_IMG } from "./header.js";
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
const goListBtn = document.getElementById("go-list-btn");
const carouselEl = document.querySelector(".post-carousel");

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
let currentSort = "latest";

// 캐러셀 관련 상태
let carouselInitialized = false;
let isDragging = false;
let dragStartX = 0;
let dragStartScrollLeft = 0;
let autoSlideTimer = null;
let autoResumeTimer = null;
let preventClick = false;
const AUTO_SLIDE_DELAY = 5000; // 5초마다 자동 슬라이드

// ------------------------------
// 유틸
// ------------------------------
function getCards() {
  if (!postListEl) return [];
  return Array.from(postListEl.querySelectorAll(".post-card"));
}

// 중앙 카드 active 처리
function updateActiveCard() {
  if (!carouselEl) return;
  const cards = getCards();
  if (!cards.length) return;

  const centerX =
    carouselEl.getBoundingClientRect().left + carouselEl.clientWidth / 2;

  let closest = null;
  let minDist = Infinity;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const dist = Math.abs(centerX - cardCenter);
    if (dist < minDist) {
      minDist = dist;
      closest = card;
    }
  });

  cards.forEach((c) => c.classList.remove("active"));
  if (closest) closest.classList.add("active");
}

// 다음 카드로 이동
function goToNextCard() {
  if (!carouselEl) return;
  const cards = getCards();
  if (!cards.length) return;

  const active = postListEl.querySelector(".post-card.active");
  let idx = active ? cards.indexOf(active) : 0;
  const nextIdx = (idx + 1) % cards.length;

  const nextCard = cards[nextIdx];
  const rect = nextCard.getBoundingClientRect();
  const carouselRect = carouselEl.getBoundingClientRect();
  const offset =
    rect.left -
    carouselRect.left -
    (carouselEl.clientWidth - rect.width) / 2;

  carouselEl.scrollLeft += offset;
  window.requestAnimationFrame(updateActiveCard);
}

// 자동 슬라이드 시작/중지
function startAutoSlide() {
  stopAutoSlide();
  autoSlideTimer = setInterval(goToNextCard, AUTO_SLIDE_DELAY);
}

function stopAutoSlide() {
  if (autoSlideTimer) {
    clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  }
}

// 유저가 조작하면 잠시 멈췄다가 다시 자동 슬라이드
function pauseAndResumeAutoSlide() {
  stopAutoSlide();
  if (autoResumeTimer) clearTimeout(autoResumeTimer);
  autoResumeTimer = setTimeout(startAutoSlide, 8000); // 8초 뒤 재시작
}

// 드래그 이벤트 설정
function setupDragEvents() {
  if (!carouselEl) return;

  function onDragStart(e) {
    isDragging = true;
    preventClick = false;                 // 새 드래그 시작 → 클릭 허용 상태
    carouselEl.classList.add("dragging");

    const pageX = e.touches ? e.touches[0].pageX : e.pageX;
    dragStartX = pageX;
    dragStartScrollLeft = carouselEl.scrollLeft;
  }

  function onDragMove(e) {
    if (!isDragging) return;

    const pageX = e.touches ? e.touches[0].pageX : e.pageX;
    const delta = pageX - dragStartX;

    // 일정 거리 이상 움직이면 이번 드래그는 "클릭이 아님"
    if (Math.abs(delta) > 5) {
      preventClick = true;
    }

    carouselEl.scrollLeft = dragStartScrollLeft - delta;

    // 모바일에서 수평 드래그 시 세로 스크롤 방지
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  function onDragEnd() {
    isDragging = false;
    carouselEl.classList.remove("dragging");
    // preventClick은 여기서 건드리지 않음
    // → click 이벤트에서 보고 나서 false로 다시 초기화
  }

  // 마우스
  carouselEl.addEventListener("mousedown", (e) => {
    onDragStart(e);
    pauseAndResumeAutoSlide();
  });

  window.addEventListener("mousemove", (e) => {
    onDragMove(e);
  });

  window.addEventListener("mouseup", () => {
    onDragEnd();
  });

  // 터치
  carouselEl.addEventListener(
    "touchstart",
    (e) => {
      onDragStart(e);
      pauseAndResumeAutoSlide();
    },
    { passive: false }
  );

  carouselEl.addEventListener(
    "touchmove",
    (e) => {
      onDragMove(e);
    },
    { passive: false }
  );

  carouselEl.addEventListener("touchend", () => {
    onDragEnd();
  });
}


// 캐러셀 초기화 + 카드 변경 후 상태 갱신
function setupPostCarousel() {
  if (!carouselEl || !postListEl) return;
  const cards = getCards();
  if (!cards.length) return;

  // 이벤트는 한 번만 붙이기
  if (!carouselInitialized) {
    setupDragEvents();

    // 스크롤 시 중앙 카드 갱신
    carouselEl.addEventListener("scroll", () => {
      window.requestAnimationFrame(updateActiveCard);
    });

    // 마우스 휠로도 좌우 스크롤 되게
    carouselEl.addEventListener(
      "wheel",
      (e) => {
        // 세로 휠 움직임을 가로 스크롤로 변환
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          carouselEl.scrollLeft += e.deltaY;
          pauseAndResumeAutoSlide();
        }
      },
      { passive: false }
    );

    carouselInitialized = true;
  }

  // 카드가 새로 렌더될 때마다 호출
  updateActiveCard();
  startAutoSlide();
}

// ------------------------------
// 카드 생성
// ------------------------------
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
    : DEFAULT_PROFILE_IMG; // 기존 상수 그대로 사용한다고 가정

  const card = document.createElement("article");
  card.className = "post-card";

  // 상단
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

  // 하단
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

  card.appendChild(header);
  card.appendChild(footer);

  // 클릭 시 상세 페이지 이동
  card.addEventListener("click", () => {
    if (preventClick) {
    preventClick = false;  // 한 번 소비하고 초기화
    return;
  }
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

  // 카드가 추가될 때마다 캐러셀 상태 갱신
  setupPostCarousel();
}

function getSortParams() {
  if (currentSort === "likes") {
    return { sort: "likes", dir: "desc" };
  }
  // 기본값 최신순
  return { sort: "createdAt", dir: "desc" };
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
// 인피니트 스크롤 (지금은 캐러셀 구조라 일단 OFF)
// ------------------------------
// 예전에는 postListEl의 세로 스크롤 기준으로 다음 페이지를 불러왔는데,
// 지금은 가로 캐러셀 + 상위 몇 개만 보여주는 구조라 주석 처리해두었어.
// 필요해지면 .post-carousel 기준으로 다시 계산해서 써도 됨.
/*
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
*/
// ------------------------------
// 정렬 버튼 이벤트
// ------------------------------
const sortButtons = document.querySelectorAll(".sort-btn");

if (sortButtons && sortButtons.length > 0) {
  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sortType = btn.dataset.sort; // 'latest' or 'likes'
      if (!sortType || sortType === currentSort) return;

      // 상태 변경
      currentSort = sortType;

      // 버튼 active 토글
      sortButtons.forEach((b) => {
        b.classList.toggle("active", b === btn);
      });

      // 페이징/캐러셀 상태 초기화
      currentPage = 0;
      isLastPage = false;
      if (postListEl) {
        postListEl.innerHTML = "";
      }

      // 자동 슬라이드 재설정
      stopAutoSlide();
      carouselInitialized = false;

      // 첫 페이지 다시 로딩
      fetchPosts(0);
    });
  });
}
// ------------------------------
// 글쓰기 버튼
// ------------------------------
if (goWriteBtn) {
  goWriteBtn.addEventListener("click", () => {
    window.location.href = "./post-create.html";
  });
}
if (goListBtn) {
  goListBtn.addEventListener("click", () => {
    window.location.href = "./posts-list.html"; // 새 목록 페이지
  });
}

// ------------------------------
// 초기 로딩
// ------------------------------
fetchPosts(0);
