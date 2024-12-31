const sendEmail = require('./utils/emailSender'); // Change to CommonJS require
const AppointmentModel = require('./models/appointmentModel'); // Change to CommonJS require
const dotenv = require('dotenv'); // Change to CommonJS require
const mongoose = require('mongoose'); // Change to CommonJS require
// const fetch = require('node-fetch'); // Change to CommonJS require

dotenv.config();
const mongoDBUri = process.env.MONGO_URI;

mongoose.connect(mongoDBUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const findAvailableSlots = async (appointmentId) => {
    // Simulate API call to find available slots
    const response = await fetch(`http://localhost:8000/api/appointment/find-slots/${appointmentId}`);
    const data = await response.json();

    return {
        nextAvailableTime: data.nextAvailableTime,
        formattedDoctorEndTime: data.formattedDoctorEndTime,
    };
};

const markAsMissedAndNotify = async () => {
    try {
        const appointmentId = '677083e6476af437c1f45e60';
        // Fetch appointment details
        const appointment = await AppointmentModel.findById(appointmentId);
        if (!appointment) {
            console.error('Appointment not found.');
            return; // Exit the function if the appointment is not found
        }

        // Fetch available slots for rescheduling
        const { nextAvailableTime, formattedDoctorEndTime } = await findAvailableSlots(appointmentId);

        // Prepare email details
        const subject = 'Missed Appointment Notification';
        const text = `
            Dear User,

            You have missed your appointment scheduled at ${appointment.time}.
            The next available slot for rescheduling is from ${nextAvailableTime} to ${formattedDoctorEndTime}.

            Please visit your dashboard to reschedule the appointment.

            Regards,
            Your Healthcare Team
        `;

        // Assuming you have a way to get the patient's email
        // const patientEmail = 'patient@example.com'; // Replace with actual patient's email

        // Send the email
        await sendEmail(subject, text); // Include patient email as the first argument
        console.log(`Notification email sent to `);
    } catch (error) {
        console.error('Error in marking as missed and sending notification:', error);
    }
};

// Call the function
markAsMissedAndNotify();

// If you want to export the function for use in other modules
// module.exports = { markAsMissedAndNotify };
