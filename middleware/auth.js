const logger = require("../config/logger");

// 로그인 인증 미들웨어
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login');
};

// 관리자 권한 체크 미들웨어
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    logger.writeLog("warn", `권한 없음: user_id(${req.session?.user?.id}) role(${req.session?.user?.role})`);
    return res.status(403).render('error', {
        layout: false,
        err: '관리자 권한이 필요합니다.',
        status: 403
    });
};

module.exports = {
    isAuthenticated,
    isAdmin
};
