const bcrypt = require('bcryptjs');
const logger = require("../../config/logger");
const userDao = require('../dao/user_dao');

module.exports = {
    // 사용자 목록 조회
    async userList(req, res) {
        const users = await userDao.findAll();
        if (!users) {
            return res.status(500).render('error', { layout: false, err: '데이터 조회 실패', status: 500 });
        }
        res.render('admin/users', { users, success: req.query.success, error: req.query.error });
    },

    // 사용자 등록
    async createUser(req, res) {
        const { username, password, name, department, role } = req.body;

        if (!username || !password || !name) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('필수 항목을 입력해주세요.'));
        }

        // 비밀번호 해싱
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await userDao.create(username, hashedPassword, name, department, role);

        if (!result) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('사용자 등록에 실패했습니다. 아이디가 중복되었을 수 있습니다.'));
        }

        logger.writeLog("info", `사용자 등록: ${username} by ${req.session.user.username}`);
        res.redirect('/admin/users?success=' + encodeURIComponent('사용자가 등록되었습니다.'));
    },

    // 사용자 수정
    async updateUser(req, res) {
        const { name, department, role } = req.body;
        const result = await userDao.update(req.params.id, name, department, role);

        if (!result) {
            return res.status(500).json({ result_yn: 0, return_msg: '사용자 수정 실패' });
        }

        logger.writeLog("info", `사용자 수정: id(${req.params.id}) by ${req.session.user.username}`);
        res.json({ result_yn: 1, return_msg: '수정되었습니다.', user: result });
    },

    // 비밀번호 초기화
    async resetPassword(req, res) {
        const { password } = req.body;
        const hashedPassword = bcrypt.hashSync(password || '1234', 10);
        const result = await userDao.updatePassword(req.params.id, hashedPassword);

        if (!result) {
            return res.status(500).json({ result_yn: 0, return_msg: '비밀번호 초기화 실패' });
        }

        logger.writeLog("info", `비밀번호 초기화: user_id(${req.params.id}) by ${req.session.user.username}`);
        res.json({ result_yn: 1, return_msg: '비밀번호가 초기화되었습니다.' });
    },

    // 사용자 삭제
    async deleteUser(req, res) {
        const result = await userDao.delete(req.params.id);
        if (!result) {
            return res.status(500).json({ result_yn: 0, return_msg: '사용자 삭제 실패 (admin 계정은 삭제할 수 없습니다)' });
        }

        logger.writeLog("info", `사용자 삭제: id(${req.params.id}) by ${req.session.user.username}`);
        res.json({ result_yn: 1, return_msg: '삭제되었습니다.' });
    }
};
