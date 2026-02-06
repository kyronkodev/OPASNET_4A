const logger = require("../../config/logger");
const rentalDao = require('../dao/rental_dao');
const equipmentDao = require('../dao/equipment_dao');
const helpers = require('../../utils/helpers');

module.exports = {
    // 대여 처리
    async rent(req, res) {
        const { equipment_id, borrower_name, borrower_dept, rent_date, return_date, use_location, purpose, notes } = req.body;

        // 장비 상태 확인
        const equipment = await equipmentDao.findById(equipment_id);
        if (!equipment) {
            return res.status(404).json({ result_yn: 0, return_msg: '장비를 찾을 수 없습니다.' });
        }
        if (equipment.status !== 'available' && equipment.status !== 'reserved') {
            return res.status(400).json({ result_yn: 0, return_msg: '대여 가능한 상태가 아닙니다.' });
        }

        // 대여 기록 생성
        const rental = await rentalDao.create(
            equipment_id, req.session.user.id, 'rent',
            borrower_name, borrower_dept,
            rent_date || new Date(), return_date,
            use_location, purpose, notes
        );

        if (!rental) {
            return res.status(500).json({ result_yn: 0, return_msg: '대여 처리 실패' });
        }

        // 장비 상태 변경
        await equipmentDao.updateStatus(equipment_id, 'rented', '대여중');

        logger.writeLog("info", `장비 대여: equipment_id(${equipment_id}) borrower(${borrower_name}) by ${req.session.user.username}`);
        res.json({ result_yn: 1, return_msg: '대여 처리되었습니다.' });
    },

    // 반납 처리
    async returnEquipment(req, res) {
        const { equipment_id, rental_id, return_location, notes } = req.body;

        // 활성 대여 확인
        const activeRental = await rentalDao.findActiveRental(equipment_id);
        if (!activeRental) {
            return res.status(400).json({ result_yn: 0, return_msg: '대여 기록을 찾을 수 없습니다.' });
        }

        // 반납 처리
        const rentalIdToUse = rental_id || activeRental.id;
        const result = await rentalDao.processReturn(rentalIdToUse, notes);
        if (!result) {
            return res.status(500).json({ result_yn: 0, return_msg: '반납 처리 실패' });
        }

        // 반납 기록 생성
        await rentalDao.create(
            equipment_id, req.session.user.id, 'return',
            activeRental.borrower_name, activeRental.borrower_dept,
            activeRental.rent_date, null,
            activeRental.use_location, activeRental.purpose, notes
        );

        // 장비 상태 변경
        await equipmentDao.updateStatus(equipment_id, 'available', return_location || '가산');

        logger.writeLog("info", `장비 반납: equipment_id(${equipment_id}) by ${req.session.user.username}`);
        res.json({ result_yn: 1, return_msg: '반납 처리되었습니다.' });
    },

    // 예약 처리
    async reserve(req, res) {
        const { equipment_id, borrower_name, borrower_dept, rent_date, return_date, use_location, purpose, notes } = req.body;

        // 장비 상태 확인
        const equipment = await equipmentDao.findById(equipment_id);
        if (!equipment) {
            return res.status(404).json({ result_yn: 0, return_msg: '장비를 찾을 수 없습니다.' });
        }
        if (equipment.status !== 'available') {
            return res.status(400).json({ result_yn: 0, return_msg: '예약 가능한 상태가 아닙니다.' });
        }

        // 예약 기록 생성
        const rental = await rentalDao.create(
            equipment_id, req.session.user.id, 'reserve',
            borrower_name, borrower_dept,
            rent_date, return_date,
            use_location, purpose, notes
        );

        if (!rental) {
            return res.status(500).json({ result_yn: 0, return_msg: '예약 처리 실패' });
        }

        // 장비 상태 변경
        await equipmentDao.updateStatus(equipment_id, 'reserved');

        logger.writeLog("info", `장비 예약: equipment_id(${equipment_id}) borrower(${borrower_name}) by ${req.session.user.username}`);
        res.json({ result_yn: 1, return_msg: '예약 처리되었습니다.' });
    },

    // 대여기록 전체 조회
    async history(req, res) {
        const { keyword, action, page } = req.query;
        const currentPage = parseInt(page) || 1;
        const limit = 20;
        const offset = (currentPage - 1) * limit;

        const result = await rentalDao.findAll(keyword, action, limit, offset);

        if (!result) {
            return res.status(500).render('error', { layout: false, err: '데이터 조회 실패', status: 500 });
        }

        const pagination = helpers.getPagination(result.totalCount, currentPage, limit);

        res.render('rental/history', {
            rentals: result.rows,
            filters: { keyword, action },
            pagination
        });
    }
};
