import { apiFetch, resolveImageUrl } from "./api-fetch.js";

function parseBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0" || value == null) return false;
  return Boolean(value); // 혹시 모를 나머지 값 방어
}

export async function fetchPostDetail(postId) {
  const detail = await apiFetch(`/board/posts/${encodeURIComponent(postId)}`, {
    method: "GET",
    includeAuth: false,
  });

  return {
    id: detail.id,
    title: detail.title,
    author: detail.writerNickname ?? "작성자",
    createdAt: detail.createdAt,
    content: detail.content,
    imageUrl: resolveImageUrl(detail.image),
    authorProfileImageUrl: resolveImageUrl(detail.writerProfileImage),
    likeCount: Number(detail.likes ?? 0),
    isLiked: parseBoolean(detail.liked),
    viewCount: Number(detail.views ?? 0),
    commentCount: Number(detail.comments ?? 0),
  };
}

export async function togglePostLike(postId, isCurrentlyLiked) {
  const result = await apiFetch(
    `/board/posts/${encodeURIComponent(postId)}/likes`,
    {
      method: isCurrentlyLiked ? "DELETE" : "POST",
    }
  );

  return {
    isLiked: parseBoolean(result.liked),
    likeCount: Number(result.likeCount ?? 0),
  };
}

export async function fetchComments(postId, page, size) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
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
    profileImageUrl: resolveImageUrl(c.writerProfileImage),
    likeCount: Number(c.likes ?? 0),
    isLiked: parseBoolean(c.liked),
  }));

  return {
    comments: mapped,
    pageInfo: result.page,
  };
}

export async function createComment(postId, content) {
  const result = await apiFetch(
    `/board/posts/${encodeURIComponent(postId)}/comments`,
    {
      method: "POST",
      body: { content },
    }
  );

  return {
    id: result.id,
    author: result.writerNickname ?? "작성자",
    createdAt: result.createdAt,
    content: result.content,
    authorProfileImageUrl: resolveImageUrl(result.writerProfileImage),
  };
}

export async function updateComment(postId, commentId, content) {
  const result = await apiFetch(
    `/board/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
      commentId
    )}`,
    {
      method: "PATCH",
      body: { content },
    }
  );

  return {
    id: result.id,
    author: result.writerNickname ?? "작성자",
    createdAt: result.createdAt,
    content: result.content,
    authorProfileImageUrl: resolveImageUrl(result.writerProfileImage),
  };
}

export async function deleteCommentApi(postId, commentId) {
  await apiFetch(
    `/board/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
      commentId
    )}`,
    { method: "DELETE" }
  );
}

export async function deletePostApi(postId) {
  await apiFetch(`/board/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
  });
}

export async function toggleCommentLike(postId, commentId, isCurrentlyLiked) {
  const result = await apiFetch(
    `/board/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
      commentId
    )}/likes`,
    {
      method: isCurrentlyLiked ? "DELETE" : "POST",
    }
  );
  return {
    isLiked: parseBoolean(result.liked),
    likeCount: Number(result.likeCount ?? 0),
  };
}