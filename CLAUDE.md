# OPASNET 4A - 장비관리 시스템

## 프로젝트 개요
4/A본부 장비 자산관리 대장을 엑셀에서 웹 시스템으로 전환한 프로젝트.
TheBreeze 그룹웨어 API 프로젝트의 MVC+DAO 패턴을 그대로 따름.

## 기술 스택
- **Backend**: Node.js + Express 5
- **Database**: PostgreSQL (pg Pool)
- **Template**: EJS + express-ejs-layouts
- **Frontend**: Bootstrap 5 + Bootstrap Icons
- **Auth**: express-session + connect-pg-simple (세션 기반)
- **Logger**: Winston + daily-rotate-file

## 아키텍처 (MVC + DAO)

```
요청 → routes/ → app/controllers/ → app/dao/ → PostgreSQL
```

### 디렉토리 구조
```
OPASNET_4A/
├── app.js                          # Express 앱 설정 (미들웨어, 라우터 등록)
├── bin/www                         # 서버 진입점 (http.createServer)
├── config/
│   ├── env.js                      # NODE_ENV별 .env 파일 로드
│   ├── .env.development            # 개발 환경변수
│   ├── .env.production             # 운영 환경변수
│   ├── database.js                 # PostgreSQL Pool (postgresPool export)
│   └── logger.js                   # Winston 로거 (writeLog 메서드)
├── middleware/
│   └── auth.js                     # isAuthenticated, isAdmin 미들웨어
├── routes/
│   ├── index_route.js              # / , /login, /logout
│   ├── equipment_route.js          # /equipment/* (장비 CRUD)
│   ├── rental_route.js             # /rental/* (대여/반납/예약)
│   └── admin_route.js              # /admin/* (사용자 관리)
├── app/
│   ├── controllers/
│   │   ├── auth_controller.js      # 로그인/로그아웃 처리
│   │   ├── equipment_controller.js # 장비 목록/등록/수정/삭제/상세
│   │   ├── rental_controller.js    # 대여/반납/예약/기록조회
│   │   └── admin_controller.js     # 사용자 CRUD, 비밀번호 초기화
│   ├── dao/
│   │   ├── user_dao.js             # users 테이블 접근
│   │   ├── equipment_dao.js        # equipment 테이블 접근
│   │   └── rental_dao.js           # rental_history 테이블 접근
│   └── views/
│       ├── layouts/default.ejs     # 공통 레이아웃 (사이드바+헤더)
│       ├── login.ejs               # 로그인 페이지
│       ├── error.ejs               # 에러 페이지
│       ├── equipment/
│       │   ├── list.ejs            # 장비현황 (검색/필터/통계카드/페이지네이션)
│       │   ├── form.ejs            # 장비 등록/수정 폼
│       │   └── detail.ejs          # 장비 상세 + 대여/반납 액션 + 기록
│       ├── rental/
│       │   └── history.ejs         # 전체 대여기록 조회
│       └── admin/
│           └── users.ejs           # 사용자 관리 (등록/수정/삭제/비밀번호초기화)
├── public/
│   ├── css/style.css               # 커스텀 스타일 (사이드바, 카드 등)
│   └── js/app.js                   # 클라이언트 JS (사이드바 토글)
├── sql/
│   └── init.sql                    # DB 스키마 + 샘플데이터 + admin 계정
└── utils/
    └── helpers.js                  # 날짜포맷, 페이지네이션, 상태라벨 등
```

## DB 테이블
- **users**: 사용자 (admin/user 역할)
- **equipment**: 장비 정보 (구분, 벤더, 모델명, 업링크, 파워이중화, 자산번호, S/N, 위치, 상태, 비고)
- **rental_history**: 대여/반납/예약 기록
- **session**: express-session 세션 저장

## 코딩 패턴 (TheBreeze 참고)

### DAO 패턴
```javascript
static async 메서드명(파라미터) {
    let logBase = `dao/클래스명.메서드명: 파라미터정보`;
    try {
        const result = await pool.query(`SQL`, [params]);
        logger.writeLog("info", `${logBase} \nResult: ...`);
        return result.rows[0]; // 또는 result.rows
    } catch (error) {
        logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
        return null;
    }
}
```

### Controller 패턴
```javascript
async 메서드명(req, res) {
    const param = req.body.param; // 또는 req.query, req.params
    const result = await someDao.메서드(param);
    if (!result) return res.status(500)...;
    res.render('뷰이름', { data }); // 또는 res.json({ result_yn: 1, return_msg: '...' })
}
```

### Route 패턴
```javascript
router.get("/경로", isAuthenticated, isAdmin, controller.메서드);
```

## 실행 방법
```bash
# 1. PostgreSQL에 DB 생성
CREATE DATABASE opasnet_4a;

# 2. 테이블 생성 (psql 또는 pgAdmin에서 sql/init.sql 실행)

# 3. config/.env.development 에서 DB 접속정보 수정

# 4. 서버 실행
npm install
npm start          # 또는: set NODE_ENV=development&& node bin/www

# 5. 접속
http://localhost:3000
# admin / admin123
```

## 권한 체계
| 기능 | 관리자(admin) | 일반사용자(user) |
|------|:---:|:---:|
| 장비 조회/상세 | O | O |
| 장비 등록/수정/삭제 | O | X |
| 대여/반납/예약 | O | O |
| 대여기록 조회 | O | O |
| 사용자 관리 | O | X |

## 디자인 가이드 (뮤트 색상 팔레트)
전체적으로 채도 낮은 톤으로 통일. 다양한 색상 사용 금지.

### CSS 변수 (`public/css/style.css`)
```css
--accent: #4a6fa5          /* 슬레이트 블루 - 메인 액센트 */
--color-available: #5b8a72 /* 차분한 녹색 - 사용가능 */
--color-rented: #b07060    /* 차분한 적색 - 대여중 */
--color-reserved: #b09a5a  /* 차분한 황색 - 예약중 */
```

### 커스텀 클래스
- **버튼**: `btn-accent`(주요), `btn-subtle`(보조), `btn-outline-muted`(테두리), `btn-muted-danger`(삭제)
- **배지**: `badge-available`, `badge-rented`, `badge-reserved`, `badge-rent`, `badge-return`, `badge-reserve`
- **테이블 헤더**: `thead-muted` (연한 회색 #f1f5f9)
- **카드 헤더**: `card-header-muted`
- **필수표시**: `style="color:var(--color-rented)"` (text-danger 사용 금지)

### helpers 전역 접근
- `app.js`에서 `res.locals.helpers`로 전역 설정됨
- 컨트롤러에서 뷰로 helpers를 별도 전달할 필요 없음
- 컨트롤러 내부에서 `getPagination()` 등 직접 호출 시에만 require 사용

## 샘플 데이터
- **관리자**: admin / admin123
- **일반사용자**: kimjs(김정수), leeym(이영미), parkdh(박동현), choish(최수현)
- **장비**: 8건 (Switch 3, Router 2, Server 1, Firewall 1, AP 1)
- **대여기록**: 21건 (대여/반납/예약 이력, RT002는 현재 대여중)

## 주의사항
- 이 프로젝트의 모든 대화는 **한글**로 진행
- Express 5 사용 중 (Express 4와 일부 차이 있음)
- 비밀번호는 bcryptjs로 해싱
- SQL은 항상 parameterized query 사용 (SQL injection 방지)
- 환경변수는 config/.env.{NODE_ENV} 파일에서 관리
- Bootstrap 기본 색상 클래스(btn-primary, text-danger 등) 대신 커스텀 뮤트 클래스 사용
