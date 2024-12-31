const moment = require('moment');
const cron = require('node-cron');
const PatientModel = require('../models/patientModel');
const AppointmentModel = require('../models/appointmentModel'); 
const sendEmail = require('./emailSender');
const DoctorModel = require('../models/doctorModel');


const checkAndUpdateMissedAppointments = async () => {
    try{
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
            
            const appointmentId = appointment._id;

             // to find available slots
             const findAvailableSlots = async (appointmentId) => {
                // Simulate API call to find available slots
                const response = await fetch(`http://localhost:8000/api/appointment/find-slots/${appointmentId}`);
                const data = await response.json();
            
                return {
                    nextAvailableTime: data.nextAvailableTime,
                    formattedDoctorEndTime: data.formattedDoctorEndTime,
                };
            };

            const patient = appointment.patient;
            const doctor = appointment.doctor;

            // Send notifications to patient and doctor
            const patient_info = await PatientModel.findById(patient);
            const doctor_info = await DoctorModel.findById(doctor);

            const patient_email = patient_info.email;
            const doctor_email = doctor_info.contact.email;

            // fetch available time slots (from api)
            const { nextAvailableTime, formattedDoctorEndTime } = await findAvailableSlots(appointmentId);

            // Prepare email details
            const subject = 'Missed Appointment Notification';
            const text = `
                Dear ${patient_info.username},
                
                You have missed your appointment with Dr. ${doctor_info.name} scheduled at ${appointment.time}.
                The next available slot for rescheduling is from ${nextAvailableTime} to ${formattedDoctorEndTime}.
                
                Please visit your dashboard to reschedule the appointment.
                
                Regards,
                A healthcare Task
            `;

            await sendEmail( subject, text);
            console.log(`Notification email sent to ${'patientEmail'}.`);
        }
    }

    }
    catch(err){
        console.error('Error in marking as missed and sending notification:', err);
        return res.status(500).json({ message: 'Error in marking as missed and sending notification' });
    }
};

module.exports = {checkAndUpdateMissedAppointments};
