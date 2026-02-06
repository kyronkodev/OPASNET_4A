const logger = require("../../config/logger");
const equipmentDao = require('../dao/equipment_dao');
const rentalDao = require('../dao/rental_dao');
const helpers = require('../../utils/helpers');  // getPagination 등 직접 호출용

module.exports = {
    // 장비 목록 조회
    async list(req, res) {
        const { category, vendor, location, status, keyword, page } = req.query;
        const currentPage = parseInt(page) || 1;
        const limit = 20;
        const offset = (currentPage - 1) * limit;

        const result = await equipmentDao.findAll(category, vendor, location, status, keyword, limit, offset);

        if (!result) {
            return res.status(500).render('error', { layout: false, err: '데이터 조회 실패', status: 500 });
        }

        const filterOptions = await equipmentDao.getFilterOptions();
        const stats = await equipmentDao.getStats();
        const pagination = helpers.getPagination(result.totalCount, currentPage, limit);

        res.render('equipment/list', {
            equipments: result.rows,
            filters: { category, vendor, location, status, keyword },
            filterOptions,
            stats,
            pagination
        });
    },

    // 장비 등록 폼
    async createForm(req, res) {
        res.render('equipment/form', {
            equipment: null,
            mode: 'create'
        });
    },

    // 장비 등록 처리
    async create(req, res) {
        const { category, vendor, model_name, uplink, power_redundancy, asset_number, serial_number, location, status, description } = req.body;

        const result = await equipmentDao.create(
            category, vendor, model_name, uplink, power_redundancy,
            asset_number, serial_number, location, status, description
        );

        if (!result) {
            return res.render('equipment/form', {
                equipment: req.body,
                mode: 'create',
                error: '장비 등록에 실패했습니다. 자산번호가 중복되었을 수 있습니다.'
            });
        }

        logger.writeLog("info", `장비 등록: ${asset_number} by ${req.session.user.username}`);
        res.redirect('/equipment');
    },

    // 장비 수정 폼
    async editForm(req, res) {
        const equipment = await equipmentDao.findById(req.params.id);
        if (!equipment) {
            return res.status(404).render('error', { layout: false, err: '장비를 찾을 수 없습니다.', status: 404 });
        }
        res.render('equipment/form', {
            equipment,
            mode: 'edit'
        });
    },

    // 장비 수정 처리
    async update(req, res) {
        const { category, vendor, model_name, uplink, power_redundancy, asset_number, serial_number, location, status, description } = req.body;

        const result = await equipmentDao.update(
            req.params.id,
            category, vendor, model_name, uplink, power_redundancy,
            asset_number, serial_number, location, status, description
        );

        if (!result) {
            const equipment = { id: req.params.id, ...req.body };
            return res.render('equipment/form', {
                equipment,
                mode: 'edit',
                error: '장비 수정에 실패했습니다.'
            });
        }

        logger.writeLog("info", `장비 수정: id(${req.params.id}) by ${req.session.user.username}`);
        res.redirect(`/equipment/${req.params.id}`);
    },

    // 장비 삭제
    async delete(req, res) {
        const result = await equipmentDao.delete(req.params.id);
        if (!result) {
            return res.status(500).json({ result_yn: 0, return_msg: '장비 삭제 실패' });
        }
        logger.writeLog("info", `장비 삭제: id(${req.params.id}) by ${req.session.user.username}`);
        res.json({ result_yn: 1, return_msg: '삭제되었습니다.' });
    },

    // 장비 상세 조회
    async detail(req, res) {
        const equipment = await equipmentDao.findById(req.params.id);
        if (!equipment) {
            return res.status(404).render('error', { layout: false, err: '장비를 찾을 수 없습니다.', status: 404 });
        }

        const rentalHistory = await rentalDao.findByEquipmentId(req.params.id);
        const activeRental = await rentalDao.findActiveRental(req.params.id);

        res.render('equipment/detail', {
            equipment,
            rentalHistory: rentalHistory || [],
            activeRental
        });
    }
};
