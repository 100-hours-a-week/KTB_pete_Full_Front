import { apiFetch, API_BASE_URL } from "./api-fetch.js";

const DEFAULT_PROFILE_IMG = "../img/dummy.png";

function resolveProfileImageUrl(url) {
  if (!url) return DEFAULT_PROFILE_IMG;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url}`;
}

export async function initHeader() {
  const titleEl = document.querySelector(".global-header-title");
  const profileBtn = document.getElementById("header-profile-btn");
  const dropdown = document.getElementById("profile-dropdown");
  const profileImgEl = profileBtn
    ? profileBtn.querySelector(".header-profile-img")
    : null;

  if (!titleEl && !profileBtn && !dropdown) return;

  if (titleEl) {
    titleEl.style.cursor = "pointer";
    titleEl.addEventListener("click", () => {
      window.location.href = "./posts.html";
    });
  }

  if (!profileBtn || !dropdown) return;

  // ------ 여기 프로필 이미지 세팅 ------
  if (profileImgEl) {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      profileImgEl.src = DEFAULT_PROFILE_IMG;
    } else {
      try {
        const me = await apiFetch("/users/me", {
          method: "GET",
        });
        // 디버깅용 한번 찍어보기
        console.log("header /users/me result:", me);

        // 백엔드 필드명에 맞게 우선순위로 체크
        const rawUrl =
          me.profileImageUrl || // camelCase 응답
          me.profile_image_url || // snake_case 응답
          me.profileImage ||      // 혹시 이렇게 돼있을 수도 있어서
          null;

        profileImgEl.src = resolveProfileImageUrl(rawUrl);
      } catch (e) {
        console.error("헤더 프로필 이미지 로딩 실패:", e);
        profileImgEl.src = DEFAULT_PROFILE_IMG;
      }
    }
  }
  // -------------------------------

  let isOpen = false;

  function openDropdown() {
    dropdown.classList.remove("hidden");
    isOpen = true;
  }

  function closeDropdown() {
    dropdown.classList.add("hidden");
    isOpen = false;
  }

  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isOpen) closeDropdown();
    else openDropdown();
  });

  document.addEventListener("click", (event) => {
    if (!isOpen) return;
    const target = event.target;
    if (target === profileBtn || dropdown.contains(target)) return;
    closeDropdown();
  });

  dropdown.addEventListener("click", async (event) => {
    const item = event.target.closest(".dropdown-item");
    if (!item) return;

    const action = item.dataset.action;

    if (action === "edit-profile") {
      window.location.href = "./profile-edit.html";
    } else if (action === "change-password") {
      window.location.href = "./password-edit.html";
    } else if (action === "logout") {
      try {
        // 백엔드 로그아웃 API 호출
        await apiFetch("/auth/logout", {
          method: "POST",
        });
      } catch (e) {
        console.error("로그아웃 API 호출 실패:", e);
        // 실패해도 클라이언트 쪽 토큰은 정리하고 보내버리는 쪽으로 감
      } finally {
        // 클라이언트 토큰 제거 + 로그인 페이지로 이동
        localStorage.removeItem("accessToken");
        window.location.href = "./login.html";
     }
    }

    closeDropdown();
  });

}
