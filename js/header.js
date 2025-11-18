// js/header.js
const USE_MOCK_AUTH = true; // 나중에 실제 API 연결할 땐 false로 바꿔도 됨

export function initHeader() {
  const profileBtn = document.getElementById("header-profile-btn");
  const dropdown = document.getElementById("profile-dropdown");
  if (!profileBtn || !dropdown) return;

  // 프로필 클릭 시 드롭다운 토글
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });

  // 바깥 클릭하면 닫기
  document.addEventListener("click", (e) => {
    if (dropdown.classList.contains("hidden")) return;
    if (
      !dropdown.contains(e.target) &&
      e.target !== profileBtn &&
      !profileBtn.contains(e.target)
    ) {
      dropdown.classList.add("hidden");
    }
  });

  // 메뉴 클릭
  dropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;

    const action = item.dataset.action;
    switch (action) {
      case "edit-profile":
        window.location.href = "./profile-edit.html";
        break;
      case "change-password":
        // 아직 페이지 없으면 나중에 만들고 경로 맞추면 됨
        window.location.href = "./password-edit.html";
        break;
      case "logout":
        handleLogout();
        break;
      default:
        break;
    }
  });
}

function handleLogout() {
  if (USE_MOCK_AUTH) {
    localStorage.removeItem("accessToken");
    alert("개발용: 로그아웃 되었다고 가정하고 로그인 페이지로 이동합니다.");
    window.location.href = "./login.html";
    return;
  }

  // 실제 API 연동 버전 예시
  fetch("http://localhost:8080/api/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
    },
  })
    .catch(() => {
      // 에러여도 어차피 토큰 제거 후 로그인으로 보내버림
    })
    .finally(() => {
      localStorage.removeItem("accessToken");
      window.location.href = "./login.html";
    });
}
