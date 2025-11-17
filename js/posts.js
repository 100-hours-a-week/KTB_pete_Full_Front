// js/posts.js

// ------------------------------
// 개발 플래그
// ------------------------------

// 게시글 더미 데이터 사용할지 여부
const USE_MOCK_POSTS = true;

// 로그인 안 한 사용자는 posts 페이지 접근 못하게 막을지 여부
const USE_LOGIN_GUARD = false; // true 로 바꾸면 토큰 없을 때 login.html로 튕김

// ------------------------------
// 로그인 가드 (선택사항)
// ------------------------------
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
const postListEl = document.getElementById("post-list");
const emptyTextEl = document.getElementById("empty-text");
const goWriteBtn = document.getElementById("go-write-btn");

// ------------------------------
// 인피니트 스크롤용 상태
// ------------------------------
let currentPage = 0;
let pageSize = 10;
let isLastPage = false;
let isLoading = false;

// ------------------------------
// 개발용 더미 게시글 데이터
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
    title: "제목 1",
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: "2021-01-01T00:00:00",
    writerNickname: "더미 작성자 1",
  },
  {
    id: 3,
    title: "제목 1",
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: "2021-01-01T00:00:00",
    writerNickname: "더미 작성자 1",
  },
  {
    id: 4,
    title: "제목 1",
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: "2021-01-01T00:00:00",
    writerNickname: "더미 작성자 1",
  },
  {
    id: 5,
    title: "제목 1",
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: "2021-01-01T00:00:00",
    writerNickname: "더미 작성자 1",
  },
  {
    id: 6,
    title: "제목 1",
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: "2021-01-01T00:00:00",
    writerNickname: "더미 작성자 1",
  },
];

// ------------------------------
// 날짜 포맷팅
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

// ------------------------------
// 응답에서 게시글 배열 뽑기
// (나중에 실제 API 구조에 맞춰서 여기만 손보면 됨)
// ------------------------------
function extractPostsFromResponse(data) {
  if (Array.isArray(data.posts)) return data.posts;
  if (Array.isArray(data.content)) return data.content;
  if (data.data && Array.isArray(data.data.posts)) return data.data.posts;
  if (data.data && Array.isArray(data.data.content)) return data.data.content;
  return [];
}

// 페이징 상태 업데이트 (Spring Page 가정)
function updatePageStateFromResponse(data) {
  if (typeof data.last === "boolean") {
    isLastPage = data.last;
  }
  if (typeof data.number === "number") {
    currentPage = data.number;
  }
  if (typeof data.size === "number") {
    pageSize = data.size;
  }
}

// ------------------------------
// 게시글 카드 DOM 생성
// ------------------------------
function createPostCard(post) {
  const {
    id,
    postId,
    title,
    createdAt,
    writerNickname,
    authorNickname,
    nickname,
    likeCount,
    likes,
    commentCount,
    commentsCount,
    viewCount,
    views,
  } = post;

  const actualId = id ?? postId;
  const postTitle = title ?? "(제목 없음)";
  const authorName = writerNickname ?? authorNickname ?? nickname ?? "작성자";
  const like = likeCount ?? likes ?? 0;
  const comment = commentCount ?? commentsCount ?? 0;
  const view = viewCount ?? views ?? 0;

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
    // TODO: 실제 상세 페이지 파일명에 맞게 수정
    window.location.href = `./post-detail.html?postId=${actualId}`;
  });

  return card;
}

// ------------------------------
// 게시글 렌더링 (append 방식)
// ------------------------------
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
// 게시글 조회 (page 단위)
// ------------------------------
async function fetchPosts(page) {
  // --- 개발용 더미 데이터 모드 ---
  if (USE_MOCK_POSTS) {
    // mockPosts를 한 번에 전부 붙여주고, 더 이상 로딩 안 하도록 처리
    appendPosts(mockPosts);
    isLastPage = true;
    return;
  }

  // --- 실제 API 모드 ---
  if (isLoading || isLastPage) return;

  isLoading = true;

  const token = localStorage.getItem("accessToken");
  const params = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
  });

  try {
    const res = await fetch(
      `http://localhost:8080/board/posts?${params.toString()}`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/json",
        },
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("게시글 조회 실패:", data);
      alert(data.message || "게시글을 불러오지 못했습니다.");
      isLoading = false;
      return;
    }

    updatePageStateFromResponse(data);
    const posts = extractPostsFromResponse(data);
    appendPosts(posts);
  } catch (err) {
    console.error(err);
    alert("서버 통신 중 오류가 발생했습니다.");
  } finally {
    isLoading = false;
  }
}

// ------------------------------
// 인피니트 스크롤
// ------------------------------
function handleScroll() {
  if (USE_MOCK_POSTS) return; // 더미 모드에선 추가 로딩 안 함
  if (isLoading || isLastPage) return;

  const { scrollTop, scrollHeight, clientHeight } = postListEl;
  const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

  if (isNearBottom) {
    fetchPosts(currentPage + 1);
  }
}

postListEl.addEventListener("scroll", handleScroll);

// ------------------------------
// 게시글 작성 버튼 클릭
// ------------------------------
goWriteBtn.addEventListener("click", () => {
  // TODO: 실제 작성 페이지 경로로 변경
  window.location.href = "./write.html";
});

// ------------------------------
// 초기 로딩
// ------------------------------
fetchPosts(0);
