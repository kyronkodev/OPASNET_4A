const logger = require("../../config/logger");
const pool = require("../../config/database").postgresPool;

module.exports = class equipmentDao {

    // 장비 목록 조회 (검색/필터/페이지네이션)
    static async findAll(_category, _vendor, _location, _status, _keyword, _limit, _offset) {
        let logBase = `dao/equipmentDao.findAll: category(${_category}) vendor(${_vendor}) location(${_location}) status(${_status}) keyword(${_keyword})`;
        try {
            let conditions = [];
            let params = [];
            let paramIdx = 1;

            if (_category) {
                conditions.push(`e.category = $${paramIdx++}`);
                params.push(_category);
            }
            if (_vendor) {
                conditions.push(`e.vendor = $${paramIdx++}`);
                params.push(_vendor);
            }
            if (_location) {
                conditions.push(`e.location = $${paramIdx++}`);
                params.push(_location);
            }
            if (_status) {
                conditions.push(`e.status = $${paramIdx++}`);
                params.push(_status);
            }
            if (_keyword) {
                conditions.push(`(e.model_name ILIKE $${paramIdx} OR e.asset_number ILIKE $${paramIdx} OR e.serial_number ILIKE $${paramIdx} OR e.description ILIKE $${paramIdx})`);
                params.push(`%${_keyword}%`);
                paramIdx++;
            }

            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

            // 전체 카운트
            const countResult = await pool.query(
                `SELECT COUNT(*) as total FROM equipment e ${whereClause}`,
                params
            );
            const totalCount = parseInt(countResult.rows[0].total);

            // 데이터 조회
            const dataParams = [...params, _limit, _offset];
            const result = await pool.query(
                `SELECT e.* FROM equipment e ${whereClause}
                 ORDER BY e.id DESC
                 LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
                dataParams
            );

            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} rows, total: ${totalCount}`);
            return { rows: result.rows, totalCount };
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 장비 상세 조회
    static async findById(_id) {
        let logBase = `dao/equipmentDao.findById: id(${_id})`;
        try {
            const result = await pool.query(
                `SELECT * FROM equipment WHERE id = $1`,
                [_id]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} rows`);
            return result.rows[0] || null;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 장비 등록
    static async create(_category, _vendor, _model_name, _uplink, _power_redundancy, _asset_number, _serial_number, _location, _status, _description) {
        let logBase = `dao/equipmentDao.create: asset_number(${_asset_number})`;
        try {
            const result = await pool.query(
                `INSERT INTO equipment (category, vendor, model_name, uplink, power_redundancy, asset_number, serial_number, location, status, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [_category, _vendor, _model_name, _uplink, _power_redundancy, _asset_number, _serial_number, _location, _status || 'available', _description]
            );
            logger.writeLog("info", `${logBase} \nResult: created id ${result.rows[0].id}`);
            return result.rows[0];
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 장비 수정
    static async update(_id, _category, _vendor, _model_name, _uplink, _power_redundancy, _asset_number, _serial_number, _location, _status, _description) {
        let logBase = `dao/equipmentDao.update: id(${_id})`;
        try {
            const result = await pool.query(
                `UPDATE equipment SET
                    category = $2, vendor = $3, model_name = $4, uplink = $5,
                    power_redundancy = $6, asset_number = $7, serial_number = $8,
                    location = $9, status = $10, description = $11,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [_id, _category, _vendor, _model_name, _uplink, _power_redundancy, _asset_number, _serial_number, _location, _status, _description]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} updated`);
            return result.rows[0] || null;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 장비 삭제
    static async delete(_id) {
        let logBase = `dao/equipmentDao.delete: id(${_id})`;
        try {
            const result = await pool.query(
                `DELETE FROM equipment WHERE id = $1`,
                [_id]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} deleted`);
            return result.rowCount > 0;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return false;
        }
    }

    // 장비 상태 변경
    static async updateStatus(_id, _status, _location) {
        let logBase = `dao/equipmentDao.updateStatus: id(${_id}) status(${_status})`;
        try {
            let query, params;
            if (_location !== undefined) {
                query = `UPDATE equipment SET status = $2, location = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
                params = [_id, _status, _location];
            } else {
                query = `UPDATE equipment SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
                params = [_id, _status];
            }
            const result = await pool.query(query, params);
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} updated`);
            return result.rows[0] || null;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 필터 옵션용 고유값 조회
    static async getFilterOptions() {
        let logBase = `dao/equipmentDao.getFilterOptions`;
        try {
            const categories = await pool.query(`SELECT DISTINCT category FROM equipment WHERE category IS NOT NULL ORDER BY category`);
            const vendors = await pool.query(`SELECT DISTINCT vendor FROM equipment WHERE vendor IS NOT NULL ORDER BY vendor`);
            const locations = await pool.query(`SELECT DISTINCT location FROM equipment WHERE location IS NOT NULL ORDER BY location`);

            logger.writeLog("info", `${logBase} \nResult: loaded filter options`);
            return {
                categories: categories.rows.map(r => r.category),
                vendors: vendors.rows.map(r => r.vendor),
                locations: locations.rows.map(r => r.location)
            };
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return { categories: [], vendors: [], locations: [] };
        }
    }

    // 대시보드 통계
    static async getStats() {
        let logBase = `dao/equipmentDao.getStats`;
        try {
            const result = await pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'available') as available,
                    COUNT(*) FILTER (WHERE status = 'rented') as rented,
                    COUNT(*) FILTER (WHERE status = 'reserved') as reserved
                FROM equipment
            `);
            logger.writeLog("info", `${logBase} \nResult: stats loaded`);
            return result.rows[0];
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return { total: 0, available: 0, rented: 0, reserved: 0 };
        }
    }
};
