const logger = require("../../config/logger");
const pool = require("../../config/database").postgresPool;

module.exports = class rentalDao {

    // 대여 기록 생성
    static async create(_equipment_id, _user_id, _action, _borrower_name, _borrower_dept, _rent_date, _return_date, _use_location, _purpose, _notes) {
        let logBase = `dao/rentalDao.create: equipment_id(${_equipment_id}) action(${_action})`;
        try {
            const result = await pool.query(
                `INSERT INTO rental_history
                    (equipment_id, user_id, action, borrower_name, borrower_dept, rent_date, return_date, use_location, purpose, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [_equipment_id, _user_id, _action, _borrower_name, _borrower_dept, _rent_date, _return_date, _use_location, _purpose, _notes]
            );
            logger.writeLog("info", `${logBase} \nResult: created id ${result.rows[0].id}`);
            return result.rows[0];
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 반납 처리 (실제 반납일시 기록)
    static async processReturn(_rental_id, _notes) {
        let logBase = `dao/rentalDao.processReturn: rental_id(${_rental_id})`;
        try {
            const result = await pool.query(
                `UPDATE rental_history
                 SET actual_return_date = CURRENT_TIMESTAMP, notes = COALESCE($2, notes)
                 WHERE id = $1
                 RETURNING *`,
                [_rental_id, _notes]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} updated`);
            return result.rows[0] || null;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 장비별 대여기록 조회
    static async findByEquipmentId(_equipment_id) {
        let logBase = `dao/rentalDao.findByEquipmentId: equipment_id(${_equipment_id})`;
        try {
            const result = await pool.query(
                `SELECT rh.*, u.name as processor_name
                 FROM rental_history rh
                 LEFT JOIN users u ON rh.user_id = u.id
                 WHERE rh.equipment_id = $1
                 ORDER BY rh.created_at DESC`,
                [_equipment_id]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} rows`);
            return result.rows;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 장비의 현재 대여 기록 (반납 안된 건)
    static async findActiveRental(_equipment_id) {
        let logBase = `dao/rentalDao.findActiveRental: equipment_id(${_equipment_id})`;
        try {
            const result = await pool.query(
                `SELECT rh.*, u.name as processor_name
                 FROM rental_history rh
                 LEFT JOIN users u ON rh.user_id = u.id
                 WHERE rh.equipment_id = $1
                   AND rh.action IN ('rent', 'reserve')
                   AND rh.actual_return_date IS NULL
                 ORDER BY rh.created_at DESC
                 LIMIT 1`,
                [_equipment_id]
            );
            logger.writeLog("info", `${logBase} \nResult: ${result.rowCount} rows`);
            return result.rows[0] || null;
        } catch (error) {
            logger.writeLog("error", `${logBase} \nStacktrace: ${error.stack}`);
            return null;
        }
    }

    // 전체 대여기록 조회 (검색/페이지네이션)
    static async findAll(_keyword, _action, _limit, _offset) {
        let logBase = `dao/rentalDao.findAll: keyword(${_keyword}) action(${_action})`;
        try {
            let conditions = [];
            let params = [];
            let paramIdx = 1;

            if (_keyword) {
                conditions.push(`(rh.borrower_name ILIKE $${paramIdx} OR rh.borrower_dept ILIKE $${paramIdx} OR e.model_name ILIKE $${paramIdx} OR e.asset_number ILIKE $${paramIdx})`);
                params.push(`%${_keyword}%`);
                paramIdx++;
            }
            if (_action) {
                conditions.push(`rh.action = $${paramIdx++}`);
                params.push(_action);
            }

            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

            // 전체 카운트
            const countResult = await pool.query(
                `SELECT COUNT(*) as total
                 FROM rental_history rh
                 LEFT JOIN equipment e ON rh.equipment_id = e.id
                 ${whereClause}`,
                params
            );
            const totalCount = parseInt(countResult.rows[0].total);

            // 데이터 조회
            const dataParams = [...params, _limit, _offset];
            const result = await pool.query(
                `SELECT rh.*, e.model_name, e.asset_number, e.category, e.vendor, u.name as processor_name
                 FROM rental_history rh
                 LEFT JOIN equipment e ON rh.equipment_id = e.id
                 LEFT JOIN users u ON rh.user_id = u.id
                 ${whereClause}
                 ORDER BY rh.created_at DESC
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
};
