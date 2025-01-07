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

// missed appointments to pat
router.get('/missed/patient/:patientId', AppointmentController.getMissedAppointmentsPat);

// find slots
router.get('/find-slots/:appointmentId', AppointmentController.FindSlotsforRescheduling);

// reschedule request
router.patch('/reschedule/:appointmentId', AppointmentController.Rescheduling);

// get rescheduled of patient
router.get('/rescheduled/patient/:patientId', AppointmentController.getRescheduledAppointmentsPat);

// get rescheduled of patient
router.get('/rescheduled/doctor/:doctorId', AppointmentController.getRescheduledAppointmentsDoc);

// update status of appointment by doctor
router.patch('/doctor/status/:appointmentId', AppointmentController.updateAppointmentStatus);

// get appointment detail by id
router.get('/:appointmentId', AppointmentController.getAppointmentDetails);



module.exports = router;