// js/post-detail-api.js
import { apiFetch, resolveImageUrl } from "./api-fetch.js";

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
    likeCount: Number(detail.likes ?? 0),
    isLiked: detail.liked ?? false,
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
    isLiked: result.liked,
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
