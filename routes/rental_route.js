var express = require("express");
var router = express.Router();
const rentalController = require('../app/controllers/rental_controller');
const { isAuthenticated } = require('../middleware/auth');

// 대여기록 조회 (모든 사용자)
router.get("/history", isAuthenticated, rentalController.history);

// 대여 처리 (모든 사용자)
router.post("/rent", isAuthenticated, rentalController.rent);

// 반납 처리 (모든 사용자)
router.post("/return", isAuthenticated, rentalController.returnEquipment);

// 예약 처리 (모든 사용자)
router.post("/reserve", isAuthenticated, rentalController.reserve);

module.exports = router;
