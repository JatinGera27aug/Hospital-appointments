const moment = require('moment');
const cron = require('node-cron');
const PatientModel = require('../models/patientModel');
const AppointmentModel = require('../models/appointmentModel'); 


const checkAndUpdateMissedAppointments = async () => {
    const now = moment();

    // only thosw which are xonfirmed but not yet started
    const appointments = await AppointmentModel.find({ status: 'confirmed',date: now.format('YYYY-MM-DD') }) // only today's date
    .maxTimeMS(20000);

    if (!appointments.length) {
        console.log('No confirmed appointments found');
    }
    console.log(appointments);
    for (const appointment of appointments) {
        const appointmentTime = moment(appointment.time, 'HH:mm');
        console.log(appointmentTime);
        const fifteenMinutesAfter = appointmentTime.clone().add(15, 'minutes');


        if (now.isAfter(fifteenMinutesAfter)) {
            // Mark as missed if time exceeds 15 minutes after scheduled time
            appointment.status = 'missed';
            await appointment.save();
            console.log(`Appointment ID: ${appointment._id} marked as missed.`);

            const patient = appointment.patient;
            const doctor = appointment.doctor;
            // Send notifications to patient and doctor
            // Implement notification logic here
            patient_info = await PatientModel.findById(patient);
            doctor_info = await DoctorModel.findById(doctor);

            patient_email = patient_info.email;
            doctor_email = doctor_info.contact.email;
        }
    }
};

module.exports = {checkAndUpdateMissedAppointments};
