const express = require("express");
const AuthController = require("../controllers/authController");
const validateAuthInput = require("../middleware/validationAuthMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// User Registration
router.post("/register", validateAuthInput, AuthController.userRegistration);

// User Login
router.post("/login", validateAuthInput, AuthController.userLogin);

// Protected Route Example
// router.get('/get/allUsers', authMiddleware, AuthController.getAllUsers);

// -- replace getAllUsers with your actual controller function --
module.exports = router;

