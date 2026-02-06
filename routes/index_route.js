var express = require("express");
var router = express.Router();
const authController = require('../app/controllers/auth_controller');

// 로그인 페이지
router.get("/", (req, res) => res.redirect('/login'));
router.get("/login", authController.loginPage);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;
