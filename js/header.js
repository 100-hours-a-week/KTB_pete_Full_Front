// js/header.js

export function initHeader() {
  const profileBtn = document.getElementById("header-profile-btn");
  const dropdown = document.getElementById("profile-dropdown");
  const titleEl = document.querySelector(".global-header-title");

  // 제목 클릭 시 홈(게시글 목록)으로 이동
  titleEl.style.cursor = "pointer";
  titleEl.addEventListener("click", () => {
    window.location.href = "./posts.html";
  });

  let isOpen = false;

  function openDropdown() {
    dropdown.classList.remove("hidden");
    isOpen = true;
  }

  function closeDropdown() {
    dropdown.classList.add("hidden");
    isOpen = false;
  }

  // 프로필 버튼 클릭 시 드롭다운 토글
  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // 드롭다운 바깥 클릭 시 닫기
  document.addEventListener("click", (event) => {
    if (!isOpen) return;
    const target = event.target;
    if (target === profileBtn || dropdown.contains(target)) return;
    closeDropdown();
  });

  // 드롭다운 메뉴 클릭 핸들링
  dropdown.addEventListener("click", (event) => {
    const item = event.target.closest(".dropdown-item");
    if (!item) return;

    const action = item.dataset.action;

    if (action === "edit-profile") {
      window.location.href = "./profile-edit.html";
    } else if (action === "change-password") {
      window.location.href = "./password-edit.html";
    } else if (action === "logout") {
      localStorage.removeItem("accessToken");
      window.location.href = "./login.html";
    }

    closeDropdown();
  });
}
