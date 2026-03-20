const express = require("express");
const {
  register,
  login,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authenticateToken, me);
router.post("/change-password", authenticateToken, changePassword);

module.exports = router;