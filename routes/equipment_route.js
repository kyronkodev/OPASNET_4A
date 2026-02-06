var express = require("express");
var router = express.Router();
const equipmentController = require('../app/controllers/equipment_controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// 장비 목록 조회 (모든 사용자)
router.get("/", isAuthenticated, equipmentController.list);

// 장비 등록 (관리자)
router.get("/create", isAuthenticated, isAdmin, equipmentController.createForm);
router.post("/create", isAuthenticated, isAdmin, equipmentController.create);

// 장비 상세 조회 (모든 사용자)
router.get("/:id", isAuthenticated, equipmentController.detail);

// 장비 수정 (관리자)
router.get("/:id/edit", isAuthenticated, isAdmin, equipmentController.editForm);
router.post("/:id/edit", isAuthenticated, isAdmin, equipmentController.update);

// 장비 삭제 (관리자)
router.post("/:id/delete", isAuthenticated, isAdmin, equipmentController.delete);

module.exports = router;
