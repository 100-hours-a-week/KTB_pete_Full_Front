import {
  fetchComments,
  createComment,
  updateComment,
  deleteCommentApi,
  toggleCommentLike,
} from "./post-detail-api.js";
import { formatDateTime } from "./date-utils.js";
import { ensureActionAuth, handleAuthError } from "./auth.js";

// 댓글 UI를 관리하기 위한 모듈
export function createCommentModule({
  postId,
  commentListEl,
  commentInputEl,
  submitBtn,
  commentCountEl,
  formatCount,
}) {
  let loadedComments = [];
  let page = 0;
  let size = 10;
  let lastPage = false;
  let loading = false;
  let totalCommentCount = 0;
  let editingCommentId = null;
  let deletingCommentId = null;

  function createCommentCard(comment, { onEdit, onDelete }) {
    const {
      id,
      author,
      createdAt,
      content,
      profileImageUrl,
      likeCount = 0,
      isLiked = false,
    } = comment;

  const card = document.createElement("div");
  card.className = "comment-card";
  card.dataset.commentId = id;

  // 아바타
  const avatar = document.createElement("div");
  avatar.className = "comment-avatar";

  if (profileImageUrl) {
    avatar.style.backgroundImage = `url('${profileImageUrl}')`;
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
    avatar.style.backgroundRepeat = "no-repeat";
  } else {
    avatar.style.backgroundImage = "";
  }

  // 바디
  const body = document.createElement("div");
  body.className = "comment-body";

  // 헤더 라인
  const headerLine = document.createElement("div");
  headerLine.className = "comment-header-line";

  const headerInner = document.createElement("div");

  const authorSpan = document.createElement("span");
  authorSpan.className = "comment-author";
  authorSpan.textContent = author;

  const dateSpan = document.createElement("span");
  dateSpan.className = "comment-date";
  dateSpan.textContent = ` · ${formatDateTime(createdAt)}`;

  headerInner.appendChild(authorSpan);
  headerInner.appendChild(dateSpan);
  headerLine.appendChild(headerInner);

  // 댓글 내용
  const textP = document.createElement("p");
  textP.className = "comment-text";
  textP.textContent = content;

  // 액션 버튼 영역
  const actions = document.createElement("div");
  actions.className = "comment-action-buttons";

  // -------------------------
  // 댓글 좋아요 버튼
  // -------------------------
  const likeBtn = document.createElement("button");
  likeBtn.type = "button";
  likeBtn.className = "comment-like-btn";
  if (isLiked) likeBtn.classList.add("liked");

  const likeIcon = document.createElement("span");
  likeIcon.className = "comment-like-icon";
  likeIcon.textContent = "👍";

  const likeCountSpan = document.createElement("span");
  likeCountSpan.className = "comment-like-count";
  likeCountSpan.textContent = String(likeCount);

  likeBtn.appendChild(likeIcon);
  likeBtn.appendChild(likeCountSpan);

  likeBtn.addEventListener("click", async () => {
    if (!ensureActionAuth()) return;

    // 🔥 현재 화면에서 눌려 있는지 여부를 기준으로 보자
    const isCurrentlyLiked = likeBtn.classList.contains("liked");

    try {
      const result = await toggleCommentLike(postId, id, isCurrentlyLiked);

      // 서버가 말해준 정답으로 state 동기화
      comment.isLiked = result.isLiked;
      comment.likeCount = result.likeCount;

      likeCountSpan.textContent = String(result.likeCount);
      likeBtn.classList.toggle("liked", result.isLiked);
    } catch (err) {
      console.error(err);
      if (
        handleAuthError(err, {
          fallbackMessage: "댓글 좋아요 처리에 실패했습니다.",
        })
      ) {
        return;
      }
    }
  });

  // 수정 버튼
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "comment-action-btn edit-btn";
  editBtn.textContent = "수정";
  editBtn.addEventListener("click", () => onEdit(comment));

  // 삭제 버튼
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "comment-action-btn danger delete-btn";
  deleteBtn.textContent = "삭제";
  deleteBtn.addEventListener("click", () => onDelete(comment));

  // 액션 영역 조립: [👍 n] [수정] [삭제]
  actions.appendChild(likeBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  // 전체 조립
  body.appendChild(headerLine);
  body.appendChild(textP);
  body.appendChild(actions);

  card.appendChild(avatar);
  card.appendChild(body);

  return card;
}

  async function loadMore() {
    if (loading || lastPage) return;
    loading = true;

    try {
      const { comments, pageInfo } = await fetchComments(postId, page, size);

      comments.forEach((c) => {
        loadedComments.push(c);
        const card = createCommentCard(c, {
          onEdit: handleEditClick,
          onDelete: handleDeleteClick,
        });
        commentListEl.appendChild(card);
      });

      if (pageInfo) {
        page = pageInfo.page;
        size = pageInfo.size;
        if (page >= pageInfo.totalPages - 1) {
          lastPage = true;
        }
      }
    } finally {
      loading = false;
    }
  }

  async function submit() {
    const text = commentInputEl.value.trim();
    if (!text) return;

    if (editingCommentId == null) {
      const newComment = await createComment(postId, text);
      loadedComments.unshift(newComment);
      totalCommentCount += 1;
      commentCountEl.textContent = formatCount(totalCommentCount);

      const card = createCommentCard(newComment, {
        onEdit: handleEditClick,
        onDelete: handleDeleteClick,
      });
      commentListEl.prepend(card);
    } else {
      const updated = await updateComment(postId, editingCommentId, text);
      const idx = loadedComments.findIndex((c) => c.id === editingCommentId);
      if (idx !== -1) {
        loadedComments[idx] = updated;
      }
      const card = commentListEl.querySelector(
        `[data-comment-id="${editingCommentId}"]`
      );
      if (card) {
        card.querySelector(".comment-text").textContent = updated.content;
      }
    }

    editingCommentId = null;
    commentInputEl.value = "";
    submitBtn.textContent = "댓글 등록";
    submitBtn.disabled = true;
    submitBtn.classList.add("disabled");
  }

  function handleEditClick(comment) {
    editingCommentId = comment.id;
    commentInputEl.value = comment.content;
    submitBtn.textContent = "댓글 수정";
    submitBtn.disabled = false;
    submitBtn.classList.remove("disabled");
  }

  function handleDeleteClick(comment) {
    deletingCommentId = comment.id;
    // 실제 삭제 모달 open은 바깥(메인 파일)에서 담당
  }

  async function confirmDelete() {
    if (deletingCommentId == null) return;
    await deleteCommentApi(postId, deletingCommentId);
    loadedComments = loadedComments.filter((c) => c.id !== deletingCommentId);
    const card = commentListEl.querySelector(
      `[data-comment-id="${deletingCommentId}"]`
    );
    if (card) card.remove();
    deletingCommentId = null;
    totalCommentCount = Math.max(0, totalCommentCount - 1);
    commentCountEl.textContent = formatCount(totalCommentCount);
  }

  function setTotalCommentCount(count) {
    totalCommentCount = count;
    commentCountEl.textContent = formatCount(totalCommentCount);
  }

  return {
    loadMore,
    submit,
    handleDeleteClick,
    confirmDelete,
    setTotalCommentCount,
    state: {
      get editingCommentId() {
        return editingCommentId;
      },
      get deletingCommentId() {
        return deletingCommentId;
      },
    },
  };
}
