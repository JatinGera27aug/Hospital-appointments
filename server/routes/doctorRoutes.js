const express = require("express");
const DoctorController = require("../controllers/doctorController");
const router = express.Router();

router.get("/get/doctors", DoctorController.getAllDoctors);
router.post("/add/doctor", DoctorController.addNewDoctor);
router.put("/update/doctor/:doctorId", DoctorController.updateDoctor);
router.get("/get-doctor/:doctorId", DoctorController.getDoctorById);


module.exports = router;