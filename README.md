🌿 Breathe – Frontend

익명 기반 감정 공유 커뮤니티 서비스 <br>
혼자서 감정을 끌어안지 않고, 편하게 공유하며 회복할 수 있도록 돕는 웹 서비스입니다.

<br>
📽 프로젝트 소개
<br>
Breathe는 감정 기반 커뮤니티로,<br>
사용자는 익명으로 하루의 감정이나 고민을 기록하고 서로 공감할 수 있습니다.
<br>
Frontend는 Vanilla JS 기반 SPA-like 구조로 개발되었으며,<br>
Backend(Spring Boot) REST API와 연동하여 실제 서비스 흐름을 구현했습니다.
<br>
👉 이 레포지토리는 Breathe 프로젝트의 프론트엔드 저장소입니다.

<br>
🚀 주요 기능<br>
기능	설명<br>
회원가입 / 로그인	프로필 이미지 업로드, 이메일/비밀번호 규칙 검증, JWT 기반 인증<br>
프로필 수정	닉네임 변경, 프로필 이미지 변경, 회원 탈퇴<br>
게시글 CRUD	이미지 업로드, 게시글 생성/수정/삭제/조회<br>
댓글 CRUD	댓글 작성/수정/삭제 및 좋아요 기능<br>
좋아요 / 조회수 반영	게시글 및 댓글에 대한 상호작용 구현<br>
정렬 및 페이징	최신순/좋아요순 정렬, 페이지네이션<br>
캐러셀 게시글 리스트 UI	가로 캐러셀 + 자동 슬라이드 + 드래그 기반 탐색 UI<br>
인증 플로우	Access Token 만료 시 자동 재발급(Refresh Token)<br>
<br>
🧩 기술 스택<br>
Frontend
<br>
HTML5 / CSS3

Vanilla JavaScript (ES Modules)

Fetch API

FormData 기반 이미지 업로드

LocalStorage 기반 JWT Access Token 관리

Custom UI 컴포넌트(캐러셀, 드롭다운, 토스트)

협업 / 개발 환경

Git / GitHub

Live Server 기반 프론트 개발

VSCode

<br>
📁 폴더 구조
/css
    common.css
    header.css
    posts.css
    posts-list.css
    ...
/html
    login.html
    signup.html
    posts.html
    posts-list.html
    post-detail.html
    post-create.html
    profile-edit.html
    password-edit.html
/js
    api-fetch.js
    auth.js
    header.js
    posts.js
    post-detail.js
    post-detail-api.js
    post-detail-comments.js
    post-create.js
    post-edit.js
    posts-list.js
    profile-edit.js
    signup.js
    validation.js
    utils.js
/img

🔗 공통 모듈 요약 (포폴용 버전)

프론트엔드 전체를 유지보수하기 쉽게 하기 위해 모듈화를 직접 설계했습니다.

- apiFetch  
  Fetch API를 감싼 네트워크 모듈.  
  자동 인증 헤더 주입, FormData/JSON 자동 처리,  
  Access Token 만료 시 Refresh Token 기반 자동 재발급 기능 포함.

- auth  
  페이지 접근 제어(로그인 필수 페이지) 및 인증 에러 처리.

- header  
  모든 페이지에서 공통으로 사용되는 헤더/프로필 드롭다운 초기화.

- utils / validation / date-utils  
  토스트 메시지, throttle, escapeHtml, 입력 검증 등 공통 유틸.

🔐 인증 플로우

<br>
▶️ 실행 방법
git clone https://github.com/100-hours-a-week/KTB_pete_Full_Front.git
cd KTB_pete_Full_Front


VSCode에서 Live Server 확장 실행

/html/login.html 열기

백엔드(Spring Boot)를 8080 포트에서 실행

정상적으로 연동 가능

<br>
👨‍💻 담당 역할 (Frontend)

프로젝트 프론트엔드 전반을 혼자 설계 및 구현했습니다.

화면 설계 / UX 구조 정의

HTML/CSS UI 제작 (반응형 요소 적용)

모든 JavaScript 모듈 개발

인증/토큰 처리 구조 직접 설계

이미지 업로드 포함 FormData 전송 구현

게시글 캐러셀 UI 직접 구현(드래그, 자동 슬라이드)

오류 처리 및 공통 토스트 디자인

특히 **apiFetch 모듈(토큰 자동 재발급)**과
posts 캐러셀 UI는 이번 프로젝트에서 가장 핵심적으로 구현한 기능입니다.

<br>
🌱 향후 확장 계획

다크 모드 지원

PWA 기반 모바일 앱 형태로 확장

WebSocket 기반 실시간 댓글 업데이트

게시판 태그/검색 기능

임시 저장 Draft 기능

<br>
🎬 시연 영상

(추후 삽입 예정)

[여기에 시연 GIF 또는 영상 링크 삽입]

📌 레포지토리 안내

Frontend: 현재 레포지토리

Backend(Spring Boot): https://github.com/100-hours-a-week/KTB_pete_Full
