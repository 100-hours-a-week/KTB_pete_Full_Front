# 🌿 **Breathe – Frontend**
### 감정을 편하게 기록하고 공유할 수 있는 멘탈 헬스 기반 커뮤니티 서비스
<br><br>
**Breathe**는 익명 기반 감정 공유 커뮤니티로,  
누구나 가볍게 자신의 고민과 감정을 기록하고 공감받을 수 있는 공간을 목표로 합니다.
<br><br>
Frontend는 **Vanilla JavaScript + 모듈 구조**로 직접 설계하였고,  
Backend(Spring Boot) REST API와 연동하여 전체 사용자 경험 흐름을 구현했습니다.

<br><br>

---

# 🚀 **주요 기능**

### 🔐 **인증 / 사용자**
- 이메일 기반 회원가입 & 로그인  
- 프로필 이미지 업로드  
- JWT Access Token + Refresh Token 구조  
- 내 정보 조회 / 닉네임 변경  
- 비밀번호 변경  
- 회원 탈퇴  

### 📝 **게시글**
- 게시글 작성 / 수정 / 삭제  
- 이미지 1개 업로드  
- 최신순 / 좋아요순 정렬  
- 게시글 상세 페이지  
- 조회수 증가  

### 💬 **댓글**
- 댓글 작성 / 삭제  
- 댓글 좋아요  

### 🎢 **게시판 UI**
- **가로 캐러셀 UI** (드래그 + 자동 슬라이드)  
- 카드 중심 강조(Active 상태)  
- 리스트형 UI 별도 제공  

<br><br>

---

# 🧩 **기술 스택**

### **Frontend**
- Vanilla JavaScript (ES Modules)  
- Fetch API  
- FormData 이미지 업로드  
- LocalStorage 기반 Access Token 관리  

### **협업 & 개발 환경**
- VSCode  
- Live Server  

<br><br>

---

# 🔗 **공통 모듈 요약 **

### **`apiFetch`**
- 모든 네트워크 요청을 처리하는 공통 Fetch 모듈  
- 자동 Authorization 헤더 설정  
- FormData / JSON 자동 처리  
- Access Token 만료 시 Refresh Token 기반 자동 재발급  

### **`auth`**
- 로그인 여부 확인  
- 페이지 접근 제어(로그인 필수 페이지 보호)  
- 인증 에러 처리  

### **`header`**
- 전역 헤더 렌더링  
- 프로필 드롭다운 제어 (회원정보수정 / 비밀번호수정 / 로그아웃)  

### **`utils` / `validation` / `date-utils`**
- 토스트, throttle, escapeHtml, 날짜 포맷, 입력 검증 등 공통 유틸  

<br><br>

---

# ▶️ **실행 방법**

git clone https://github.com/100-hours-a-week/KTB_pete_Full_Front.git <br><br>
cd KTB_pete_Full_Front<br><br>
VSCode에서 Live Server 실행<br><br>
/html/login.html 열기<br><br>
Backend(Spring Boot)를 8080 포트에서 실행<br><br>
로그인 후 전체 기능 이용 가능

<br><br>

👨‍💻 나의 담당 역할 (Frontend)
UI/UX 화면 설계

HTML/CSS 작성

모든 JavaScript 모듈 직접 구현

인증 구조 설계

Access Token + Refresh Token 자동 재발급

apiFetch 모듈 직접 구현

게시글 캐러셀 UI 구현

FormData 기반 이미지 업로드 구현

에러 처리, 토스트, 공통 헤더 등 재사용성 중심 설계

특히 **토큰 기반 인증 구조 설계(apiFetch)**와
메인 게시판 캐러셀 UI 구현은 이번 프로젝트에서 핵심 역할입니다.

<br><br>

🌱 향후 확장 계획
<br><br>
검색 기능
<br><br>

🎬 시연 이미지 / 영상 삽입 위치

<br><br>

📌 레포지토리 안내
Frontend (현재 레포)

Backend: https://github.com/100-hours-a-week/KTB_pete_Full
