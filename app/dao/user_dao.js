const logger = require("../../config/logger");
const pool = require("../../config/database").postgresPool;

module.exports = class userDao {

    // 로그인 (username으로 사용자 조회)
    static async findByUsername(_username) {
        let logBase = `dao/userDao.findByUsername: username(${_username})`;
        try {
            const result = await pool.query(
                `SELECT * FROM users WHERE username = $1`,
                [_username]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} rows`);
            return result.rows[0] || null;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 사용자 목록 조회
    static async findAll() {
        let logBase = `dao/userDao.findAll`;
        try {
            const result = await pool.query(
                `SELECT id, username, name, department, role, created_at
                 FROM users ORDER BY id ASC`
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} rows`);
            return result.rows;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 사용자 상세 조회
    static async findById(_id) {
        let logBase = `dao/userDao.findById: id(${_id})`;
        try {
            const result = await pool.query(
                `SELECT id, username, name, department, role, created_at
                 FROM users WHERE id = $1`,
                [_id]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} rows`);
            return result.rows[0] || null;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 사용자 등록
    static async create(_username, _password, _name, _department, _role) {
        let logBase = `dao/userDao.create: username(${_username})`;
        try {
            const result = await pool.query(
                `INSERT INTO users (username, password, name, department, role)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, username, name, department, role, created_at`,
                [_username, _password, _name, _department, _role || 'user']
            );
            logger.writeLog("info", `${logBase} \nResult: created id ${result.rows[0].id}`);
            return result.rows[0];
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 사용자 수정
    static async update(_id, _name, _department, _role) {
        let logBase = `dao/userDao.update: id(${_id})`;
        try {
            const result = await pool.query(
                `UPDATE users SET name = $2, department = $3, role = $4
                 WHERE id = $1
                 RETURNING id, username, name, department, role`,
                [_id, _name, _department, _role]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} updated`);
            return result.rows[0] || null;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 비밀번호 변경
    static async updatePassword(_id, _password) {
        let logBase = `dao/userDao.updatePassword: id(${_id})`;
        try {
            const result = await pool.query(
                `UPDATE users SET password = $2 WHERE id = $1`,
                [_id, _password]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} updated`);
            return result.rowCount > 0;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return false;
        }
    }

    // 사용자 삭제
    static async delete(_id) {
        let logBase = `dao/userDao.delete: id(${_id})`;
        try {
            const result = await pool.query(
                `DELETE FROM users WHERE id = $1 AND username != 'admin'`,
                [_id]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} deleted`);
            return result.rowCount > 0;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return false;
        }
    }
};
