# 멘토-멘티 매칭 앱

이 애플리케이션은 멘토와 멘티를 매칭해주는 웹 애플리케이션입니다.

## 프로젝트 구조

```
application/
├── backend/          # Node.js + Express 백엔드 API
└── frontend/         # React 프론트엔드
```

## 실행 방법

### 1. 백엔드 실행

```bash
cd application/backend
npm install
npm start
```

백엔드는 `http://localhost:8080`에서 실행됩니다.
- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/openapi.json`

### 2. 프론트엔드 실행

새 터미널에서:

```bash
cd application/frontend
npm install
npm start
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## 기능

### 공통 기능
- 회원가입 및 로그인 (JWT 인증)
- 프로필 관리 (이름, 소개, 프로필 이미지)

### 멘토 기능
- 기술 스택 등록
- 받은 매칭 요청 확인
- 요청 수락/거절

### 멘티 기능
- 멘토 목록 조회 및 검색
- 멘토에게 매칭 요청 전송
- 보낸 요청 상태 확인 및 삭제

## 기술 스택

### 백엔드
- Node.js + Express
- SQLite (로컬 파일 기반)
- JWT 인증
- Swagger/OpenAPI 문서화
- Multer (파일 업로드)
- 보안: Helmet, CORS, Rate Limiting

### 프론트엔드
- React 18
- React Router (라우팅)
- Axios (HTTP 클라이언트)
- Context API (상태 관리)

## API 엔드포인트

### 인증
- `POST /api/signup` - 회원가입
- `POST /api/login` - 로그인

### 사용자
- `GET /api/me` - 내 정보 조회
- `PUT /api/me` - 프로필 업데이트
- `POST /api/me/image` - 프로필 이미지 업로드
- `GET /api/images/:role/:id` - 프로필 이미지 조회

### 멘토
- `GET /api/mentors` - 멘토 목록 조회 (멘티만)

### 매칭
- `POST /api/matching-requests` - 매칭 요청 생성 (멘티만)
- `GET /api/matching-requests` - 매칭 요청 목록
- `PUT /api/matching-requests/:id` - 요청 수락/거절 (멘토만)
- `DELETE /api/matching-requests/:id` - 요청 삭제 (멘티만)

## 데이터베이스

SQLite를 사용하며, 애플리케이션 시작 시 자동으로 테이블이 생성됩니다.

### 테이블 구조

#### users
- 멘토와 멘티 모두 저장
- 프로필 이미지는 BLOB로 저장
- 멘토의 기술 스택은 JSON 문자열로 저장

#### matching_requests
- 매칭 요청 정보 저장
- 상태: pending, accepted, rejected

## 보안 기능

- JWT 토큰 기반 인증 (1시간 유효)
- 비밀번호 해싱 (bcrypt)
- SQL 인젝션 방지
- XSS 방지 (Helmet)
- Rate Limiting
- 파일 업로드 검증 (크기, 형식)

## 개발 모드

개발 모드로 실행하려면:

```bash
# 백엔드
cd application/backend
npm run dev

# 프론트엔드
cd application/frontend
npm start
```
