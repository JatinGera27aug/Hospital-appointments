const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController.js');

// get all appointments
router.get('/get-appointment', AppointmentController.getAllAppointments);

// get single appointment by doctor id
router.get('/doctor/:doctorId', AppointmentController.getAppointmentByDoctor);

// get single appointment by patient id
router.get('/patient/:patientId', AppointmentController.getAppointmentByPatient);

// adding a appointment
router.post('/book', AppointmentController.MakeAppointment);

// pending appointments to doc
router.get('/pending/doctor/:doctorId', AppointmentController.getPendingAppointmentsDoc);

// pending appointments of patient
router.get('/pending/patient/:patientId', AppointmentController.getPendingAppointmentsPatient);

// pending appointments all
router.get('/pending', AppointmentController.getAllPendingAppointments);

// pending to confirmed
router.patch('/confirm/:doctorId/:appointmentId', AppointmentController.confirmAppointment);

// cancelling by patient
router.patch('/cancel/patient/:patientId/:appointmentId', AppointmentController.cancelAppointmentByPatient);

// cancelling by doctor
router.patch('/cancel/doctor/:doctorId/:appointmentId', AppointmentController.cancelAppointmentByDoctor);

// confirmed appointments to doc
router.get('/confirmed/doctor/:doctorId', AppointmentController.getConfirmedAppointmentsDoc);

// confirm to ongoing by doc
router.patch('/ongoing/:doctorId/:appointmentId', AppointmentController.OngoingAppointmentByDoctor);

// ongoing to completed
router.patch('/complete/:doctorId/:appointmentId', AppointmentController.completeAppointmentByDoctor);

// missed appointments to doc
router.get('/missed/doctor/:doctorId', AppointmentController.getMissedAppointmentsDoc);




module.exports = router;