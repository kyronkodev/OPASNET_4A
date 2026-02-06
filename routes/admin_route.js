var express = require("express");
var router = express.Router();
const adminController = require('../app/controllers/admin_controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// 사용자 관리 (관리자)
router.get("/users", isAuthenticated, isAdmin, adminController.userList);
router.post("/users/create", isAuthenticated, isAdmin, adminController.createUser);
router.post("/users/:id/update", isAuthenticated, isAdmin, adminController.updateUser);
router.post("/users/:id/reset-password", isAuthenticated, isAdmin, adminController.resetPassword);
router.post("/users/:id/delete", isAuthenticated, isAdmin, adminController.deleteUser);

module.exports = router;
