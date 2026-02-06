const bcrypt = require('bcryptjs');
const logger = require("../../config/logger");
const userDao = require('../dao/user_dao');

module.exports = {
    // 로그인 페이지
    loginPage(req, res) {
        if (req.session && req.session.user) {
            return res.redirect('/equipment');
        }
        res.render('login', { layout: false, error: null });
    },

    // 로그인 처리
    async login(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('login', { layout: false, error: '아이디와 비밀번호를 입력해주세요.' });
        }

        const user = await userDao.findByUsername(username);

        if (!user) {
            logger.writeLog("warn", `로그인 실패: 존재하지 않는 사용자 - ${username}`);
            return res.render('login', { layout: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            logger.writeLog("warn", `로그인 실패: 비밀번호 불일치 - ${username}`);
            return res.render('login', { layout: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        // 세션에 사용자 정보 저장
        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            department: user.department,
            role: user.role
        };

        logger.writeLog("info", `로그인 성공: ${username} (${user.name})`);
        return res.redirect('/equipment');
    },

    // 로그아웃
    logout(req, res) {
        const username = req.session?.user?.username;
        req.session.destroy((err) => {
            if (err) {
                logger.writeLog("error", `로그아웃 실패: ${err.message}`);
            } else {
                logger.writeLog("info", `로그아웃: ${username}`);
            }
            res.redirect('/login');
        });
    }
};
