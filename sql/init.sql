-- OPASNET 4A 장비관리 시스템 DB 초기화 스크립트
-- PostgreSQL

-- 데이터베이스 생성 (psql에서 실행)
-- CREATE DATABASE opasnet_4a;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 장비 테이블
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50),
    vendor VARCHAR(50),
    model_name VARCHAR(100),
    uplink VARCHAR(50),
    power_redundancy VARCHAR(10),
    asset_number VARCHAR(50) UNIQUE,
    serial_number VARCHAR(100),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 대여기록 테이블
CREATE TABLE IF NOT EXISTS rental_history (
    id SERIAL PRIMARY KEY,
    equipment_id INT REFERENCES equipment(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    action VARCHAR(20) NOT NULL,
    borrower_name VARCHAR(100),
    borrower_dept VARCHAR(100),
    rent_date TIMESTAMP,
    return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    use_location VARCHAR(200),
    purpose TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 세션 테이블 (connect-pg-simple이 자동 생성하지만 미리 만들어둠)
CREATE TABLE IF NOT EXISTS "session" (
    "sid" VARCHAR NOT NULL COLLATE "default",
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_vendor ON equipment(vendor);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location);
CREATE INDEX IF NOT EXISTS idx_equipment_asset_number ON equipment(asset_number);
CREATE INDEX IF NOT EXISTS idx_rental_equipment_id ON rental_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_rental_user_id ON rental_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_action ON rental_history(action);

-- 기본 관리자 계정 (비밀번호: admin123, bcrypt 해시)
-- bcryptjs.hashSync('admin123', 10) 결과
INSERT INTO users (username, password, name, department, role)
VALUES ('admin', '$2b$10$PGb5qhNcOKnMSfrWQt0B5uUIpiuxhYK2WY8x8NZatifecKyLCZiby', '관리자', '4/A본부', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 샘플 장비 데이터
INSERT INTO equipment (category, vendor, model_name, uplink, power_redundancy, asset_number, serial_number, location, status, description) VALUES
('Switch', 'Cisco', 'WS-C2960-24TT-L', '1G 2p', 'x', 'SW001', 'FOC1234X001', '가산', 'available', '24포트 스위치'),
('Switch', 'Cisco', 'WS-C2960-48TT-L', '1G 2p', 'x', 'SW002', 'FOC1234X002', '가산', 'available', '48포트 스위치'),
('Switch', 'Cisco', 'WS-C3750G-24TS', '1G 4p', 'o', 'SW003', 'FOC1234X003', '가산(Lab실)', 'available', 'L3 스위치'),
('Router', 'Cisco', 'ISR4321/K9', '1G 2p', 'x', 'RT001', 'FTX1234R001', '가산', 'available', '라우터'),
('Router', 'Cisco', 'ISR4331/K9', '1G 3p', 'o', 'RT002', 'FTX1234R002', '가산(Lab실)', 'rented', '라우터'),
('Server', 'HP', 'DL380 Gen10', '10G 4p', 'o', 'SV001', 'MXQ1234S001', '가산', 'available', '서버'),
('Firewall', 'Palo Alto', 'PA-820', '1G 8p', 'o', 'FW001', 'PA1234F001', '가산(Lab실)', 'available', '방화벽'),
('AP', 'Cisco', 'AIR-AP2802I', '1G 1p', 'x', 'AP001', 'FCW1234A001', '가산', 'available', '무선AP')
ON CONFLICT (asset_number) DO NOTHING;

-- 샘플 사용자 데이터 (비밀번호: 1234)
-- bcryptjs.hashSync('1234', 10) 결과
INSERT INTO users (username, password, name, department, role) VALUES
('kimjs', '$2b$10$PGb5qhNcOKnMSfrWQt0B5uUIpiuxhYK2WY8x8NZatifecKyLCZiby', '김정수', '4/A본부', 'user'),
('leeym', '$2b$10$PGb5qhNcOKnMSfrWQt0B5uUIpiuxhYK2WY8x8NZatifecKyLCZiby', '이영미', 'NI사업부', 'user'),
('parkdh', '$2b$10$PGb5qhNcOKnMSfrWQt0B5uUIpiuxhYK2WY8x8NZatifecKyLCZiby', '박동현', 'NI사업부', 'user'),
('choish', '$2b$10$PGb5qhNcOKnMSfrWQt0B5uUIpiuxhYK2WY8x8NZatifecKyLCZiby', '최수현', '기술지원팀', 'user')
ON CONFLICT (username) DO NOTHING;

-- 샘플 대여기록 데이터
-- RT002(id=5)는 현재 rented 상태 → 가장 최근 대여기록이 활성 상태여야 함

-- 1) SW001(id=1): 과거 대여→반납 완료 (김정수)
INSERT INTO rental_history (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, actual_return_date, use_location, purpose, notes, created_at) VALUES
(1, 1, 'rent', '김정수', '4/A본부', '2025-09-01 09:00:00', '2025-09-15 18:00:00', NULL, '분당 현장', '고객사 네트워크 구성 테스트', NULL, '2025-09-01 09:00:00'),
(1, 1, 'return', '김정수', '4/A본부', '2025-09-01 09:00:00', '2025-09-15 18:00:00', '2025-09-14 17:30:00', '분당 현장', '고객사 네트워크 구성 테스트', '예정보다 1일 일찍 반납', '2025-09-14 17:30:00');

-- 2) SW002(id=2): 과거 대여→반납 완료 (이영미)
INSERT INTO rental_history (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, actual_return_date, use_location, purpose, notes, created_at) VALUES
(2, 1, 'rent', '이영미', 'NI사업부', '2025-10-07 10:00:00', '2025-10-21 18:00:00', NULL, '상암 IDC', 'L2 스위치 교체 작업', NULL, '2025-10-07 10:00:00'),
(2, 1, 'return', '이영미', 'NI사업부', '2025-10-07 10:00:00', '2025-10-21 18:00:00', '2025-10-20 16:00:00', '상암 IDC', 'L2 스위치 교체 작업', '정상 반납', '2025-10-20 16:00:00');

-- 3) SW003(id=3): 과거 대여→반납, 다시 대여→반납 (박동현, 최수현)
INSERT INTO rental_history (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, actual_return_date, use_location, purpose, notes, created_at) VALUES
(3, 1, 'rent', '박동현', 'NI사업부', '2025-08-12 09:30:00', '2025-08-26 18:00:00', NULL, '판교 고객사', 'L3 스위치 PoC', NULL, '2025-08-12 09:30:00'),
(3, 1, 'return', '박동현', 'NI사업부', '2025-08-12 09:30:00', '2025-08-26 18:00:00', '2025-08-28 10:00:00', '판교 고객사', 'L3 스위치 PoC', '반납 2일 지연 - 고객 요청으로 연장', '2025-08-28 10:00:00'),
(3, 2, 'rent', '최수현', '기술지원팀', '2025-11-04 09:00:00', '2025-11-18 18:00:00', NULL, '가산 교육장', '신입 교육용', NULL, '2025-11-04 09:00:00'),
(3, 2, 'return', '최수현', '기술지원팀', '2025-11-04 09:00:00', '2025-11-18 18:00:00', '2025-11-18 17:00:00', '가산 교육장', '신입 교육용', '정상 반납', '2025-11-18 17:00:00');

-- 4) RT001(id=4): 과거 예약→대여→반납 (김정수)
INSERT INTO rental_history (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, actual_return_date, use_location, purpose, notes, created_at) VALUES
(4, 1, 'reserve', '김정수', '4/A본부', '2025-11-20 09:00:00', '2025-12-04 18:00:00', NULL, '용산 고객사', '라우터 교체 프로젝트', '11/20 이후 수령 예정', '2025-11-15 14:00:00'),
(4, 1, 'rent', '김정수', '4/A본부', '2025-11-20 09:00:00', '2025-12-04 18:00:00', NULL, '용산 고객사', '라우터 교체 프로젝트', '예약 건 수령 완료', '2025-11-20 09:00:00'),
(4, 1, 'return', '김정수', '4/A본부', '2025-11-20 09:00:00', '2025-12-04 18:00:00', '2025-12-03 15:00:00', '용산 고객사', '라우터 교체 프로젝트', '정상 반납', '2025-12-03 15:00:00');

-- 5) RT002(id=5): 현재 대여중 (박동현) → status가 'rented'인 장비
INSERT INTO rental_history (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, actual_return_date, use_location, purpose, notes, created_at) VALUES
(5, 1, 'rent', '박동현', 'NI사업부', '2026-01-13 10:00:00', '2026-02-14 18:00:00', NULL, '세종시 고객사', 'WAN 라우터 PoC 진행', NULL, '2026-01-13 10:00:00');

-- 6) SV001(id=6): 과거 대여→반납 (이영미)
INSERT INTO rental_history (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, actual_return_date, use_location, purpose, notes, created_at) VALUES
(6, 1, 'rent', '이영미', 'NI사업부', '2025-10-14 09:00:00', '2025-11-14 18:00:00', NULL, '상암 IDC', '서버 마이그레이션 테스트', '랙 설치 필요', '2025-10-14 09:00:00'),
(6, 1, 'return', '이영미', 'NI사업부', '2025-10-14 09:00:00', '2025-11-14 18:00:00', '2025-11-12 14:00:00', '상암 IDC', '서버 마이그레이션 테스트', '정상 반납, 랙 철거 완료', '2025-11-12 14:00:00');

-- 7) FW001(id=7): 과거 대여→반납 (최수현)
INSERT INTO rental_history (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, actual_return_date, use_location, purpose, notes, created_at) VALUES
(7, 1, 'rent', '최수현', '기술지원팀', '2025-12-02 09:00:00', '2025-12-16 18:00:00', NULL, '강남 고객사', '방화벽 데모', NULL, '2025-12-02 09:00:00'),
(7, 1, 'return', '최수현', '기술지원팀', '2025-12-02 09:00:00', '2025-12-16 18:00:00', '2025-12-16 17:30:00', '강남 고객사', '방화벽 데모', '고객 구매 확정', '2025-12-16 17:30:00');

-- 8) AP001(id=8): 과거 대여→반납, 최근 다시 대여→반납 (김정수, 박동현)
INSERT INTO rental_history (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, actual_return_date, use_location, purpose, notes, created_at) VALUES
(8, 1, 'rent', '김정수', '4/A본부', '2025-09-22 09:00:00', '2025-10-06 18:00:00', NULL, '가산 3층 회의실', '무선 AP 커버리지 테스트', NULL, '2025-09-22 09:00:00'),
(8, 1, 'return', '김정수', '4/A본부', '2025-09-22 09:00:00', '2025-10-06 18:00:00', '2025-10-04 11:00:00', '가산 3층 회의실', '무선 AP 커버리지 테스트', '정상 반납', '2025-10-04 11:00:00'),
(8, 2, 'rent', '박동현', 'NI사업부', '2025-12-23 10:00:00', '2026-01-06 18:00:00', NULL, '수원 고객사', '무선 환경 현장 점검', NULL, '2025-12-23 10:00:00'),
(8, 2, 'return', '박동현', 'NI사업부', '2025-12-23 10:00:00', '2026-01-06 18:00:00', '2026-01-06 16:00:00', '수원 고객사', '무선 환경 현장 점검', '정상 반납', '2026-01-06 16:00:00');
