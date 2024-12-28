// // console.log(new Date());

// import moment from 'moment';
// const now = moment();
// // // Current time
// // const now = moment(); // Automatically gets the current time
// // console.log('Current Time:', now.format('hh:mm A'));
// // const moment = require('moment');
// // const cron = require('node-cron');
// import AppointmentModel from './models/appointmentModel.js';
// // const AppointmentModel = require('../models/appointmentModel'); // Adjust path based on your structure
// const appointments = await AppointmentModel.find({date: now.format('YYYY-MM-DD')})
// .maxTimeMS(20000);
// for (const appointment of appointments) {
//     const appointmentStart = moment(appointment.time, 'HH:mm');
//     appointment.endTime = appointmentStart.add(appointment.duration, 'minutes').format('HH:mm');
//     await appointment.save();
// }

const moment = require('moment-timezone')
const timezone = 'Asia/Kolkata';
        const now = moment().tz(timezone);  // Get the current time in IST
        const today_date = moment().tz(timezone).startOf('day');
console.log(now, today_date);