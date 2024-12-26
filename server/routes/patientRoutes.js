const express = require("express");
const router = express.Router();

const PatientController = require("../controllers/patientController");

router.post("/add-patient", PatientController.addPatient);
router.get("/all-patient", PatientController.getAllPatients);
module.exports = router;