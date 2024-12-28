// static async MakeAppointment(req, res) {
//     const { doctorId:doctor, patientId:patient, date, time, duration, mode_of_payment} = req.body;
//     console.log(req.body);

//     try{
//         if (!doctor || !patient || !date || !time || !duration || !mode_of_payment) {
           
//             return res.status(400).json({ message: 'Please provide all required fields' });
//         }
//         // now = moment();
//         // // appointment time comparison
//         // const today_date = new Date().toISOString().split('T')[0]; // get current date in YYYY-MM-DD format

//         // if (new Date(req.body.date) == today_date) {
//         //     const scheduled_time = moment(time, 'hh:mm'); // 10:00 
//         //     if (now.isAfter(scheduled_time)){
//         //         console.log("4");
//         //         return res.status(400).json({ message: 'Appointment time must be in the future - time' });
//         // }
//         // }
//         // else if (new Date(req.body.date) < today_date) {
//         //     return res.status(400).json({ message: 'Appointment time must be in the future - date' });
//         // }

//         // appointment time comparison

//         const timezone = 'Asia/Kolkata';
//         const now = moment().tz(timezone);  // Get the current time in IST
//         const today_date = moment().tz(timezone).startOf('day');
        
//         if (moment.tz(req.body.date, timezone).isSame(today_date, 'day')) {
//             const scheduled_time = moment.tz(`${req.body.date} ${req.body.time}`, 'YYYY-MM-DD HH:mm', timezone); // Include date with timezone
//             if (now.isAfter(scheduled_time)) {
//                 console.log("4");
//                 return res.status(400).json({ message: 'Appointment time must be in the future - time' });
//             }
//         } else if (moment.tz(req.body.date, timezone).isBefore(today_date, 'day')) {
//             return res.status(400).json({ message: 'Appointment time must be in the future - date' });
//         }
        
//         if (req.body.status) { // to not let someone change status from pending to anything at the time of creation, if req contains status, it simply gets rejected
//             return res.status(400).json({ message: "Cannot set status manually at creation" });
//         }            
        
//         const doctor_assigned = await DoctorModel.findById(doctor);
//         if (!doctor_assigned) {
//             return res.status(404).json({ message: 'Doctor not found' });
//         }
//         const patient_applied = await PatientModel.findById(patient);
//         if (!patient_applied) {
//             return res.status(404).json({ message: 'Patient not found' });
//         }

//         // appointment should be only between doctor.availability.startTime and scheduled time + duration < endTime
//         // const doctor_availability = doctor_assigned.availability.find((availability) => availability.day === moment(date).format('dddd'));
//         // if (!doctor_availability) {
//         //     return res.status(400).json({ message: 'Doctor is not available on this day' });
//         // }

//         const appointmentDay = moment.tz(date, timezone).format('dddd');
//         console.log(appointmentDay);

//         // Check if the day matches the doctor's availability
//         const availability_day = doctor_assigned.availability.find((slot) => slot.day === appointmentDay);
//         if (!availability_day) {
//             return res.status(400).json({message: "The doctor is not available on this day." });
//         }

//         const appointmentStart = moment(time, 'HH:mm'); // appointment start time
//         const appointmentEnd = appointmentStart.clone().add(duration, 'minutes'); // Adding duration to iy 

        
//         const availabilityStart = moment(availability_day.startTime, 'HH:mm'); // doctpr start time on basis of that available day
//         const availabilityEnd = moment(availability_day.endTime, 'HH:mm'); //end time of that day
//         // const endTime =  moment(time, 'HH:mm').add(duration, 'minutes').format('HH:mm')

//         const graceEnd = availabilityEnd.clone().add(10, 'minutes');
//         const criticalEnd = availabilityEnd.clone().subtract(10, 'minutes');

//         // Check if appointmentStart and appointmentEnd are within the availability window
//         const isWithinAvailability = appointmentStart.isSameOrAfter(availabilityStart) &&
//                                      appointmentEnd.isSameOrBefore(graceEnd) &&
//                                      appointmentStart.isBefore(criticalEnd) ;

//         if (!isWithinAvailability) {
//             console.log('Appointment time does not fit within the doctor\'s available hours.');
//             return res.status(400).json({ message: 'Appointment time does not fit within the doctor\'s available hours.' });
//         } 


//         // const appointmentStart1 = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm'); // New appointment start
//         // const appointmentEnd1 = appointmentStart1.clone().add(duration, 'minutes'); // New appointment end

//         // Parse the date and time with the correct timezone
//         const appointmentStart1 = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone);
//         const appointmentEnd1 = appointmentStart1.clone().add(duration, 'minutes');
//         // Check if the patient already has an appointment during the same time frame
//         // Check for patient conflicts
//         const existingPatientAppointment = await AppointmentModel.findOne({
//             patient,
//             date,
//             status: { $in: ['pending', 'confirmed', 'ongoing'] },
//             $or: [
//                 { time: { $lte: appointmentEnd1.format('HH:mm') }, endTime: { $gte: appointmentStart1.format('HH:mm') } }
//             ]
//         });
//         console.log("Existing Patient Appointment:", existingPatientAppointment);
//         if (existingPatientAppointment) {
//             return res.status(400).json({ message: 'You already have an appointment booked during this time frame.' });
//         }
        


//     // Check for conflicting appointments with the doctor
//     // const existingDoctorAppointment = await AppointmentModel.findOne({
//     //     doctor,
//     //     date,
//     //     status: { $in: ['confirmed', 'ongoing'] }, // Only check confirmed or ongoing appointments
//     //     $or: [
//     //         {
//     //             $and: [
//     //                 { time: { $lte: appointmentEnd1.format('HH:mm') } },
//     //                 { time: { $gte: appointmentStart1.format('HH:mm') } }
//     //             ]
//     //         },
//     //         {
//     //             $and: [
//     //                 { time: { $gte: appointmentStart1.format('HH:mm') } },
//     //                 { time: { $lte: appointmentEnd1.format('HH:mm') } }
//     //             ]
//     //         }
//     //     ]
//     // });
//     console.log('lojjee')
//     const existingDoctorAppointment = await AppointmentModel.findOne({
//         doctor,
//         date,
//         status: { $in: ['confirmed', 'ongoing'] },
//         $or: [
//             { time: { $lte: appointmentEnd1.format('HH:mm') }, endTime: { $gte: appointmentStart1.format('HH:mm') } }
//         ]
//     });
//     console.log("Existing Doctor Appointment:", existingDoctorAppointment);

//     if (existingDoctorAppointment) {
//         return res.status(400).json({ message: 'The doctor already has an appointment booked during this time frame.' });
//     }


//     // Create the appointment
//     const appointment = new AppointmentModel({
//         doctor,
//         patient,
//         date,
//         time,
//         duration,
//         mode_of_payment,
//     });

//     const savedAppointment = await appointment.save()
//         if(savedAppointment)
//         return res.status(201).json({ message: 'Appointment created successfully', appointment });
        
//         else{
//             return res.status(500).json({ message: 'Error saving appointment to the database.', error: err });
//         }

// }
//     catch(err) {
//         return res.status(500).json({ message: 'Error creating appointment', error: err });
//     }
// }










// static async MakeAppointment(req, res) {
    //     const { doctorId:doctor, patientId:patient, date, time, duration, mode_of_payment} = req.body;
    //     console.log(req.body);

    //     try{
    //         if (!doctor || !patient || !date || !time || !duration || !mode_of_payment) {
               
    //             return res.status(400).json({ message: 'Please provide all required fields' });
    //         }
    //         // now = moment();
    //         // // appointment time comparison
    //         // const today_date = new Date().toISOString().split('T')[0]; // get current date in YYYY-MM-DD format

    //         // if (new Date(req.body.date) == today_date) {
    //         //     const scheduled_time = moment(time, 'hh:mm'); // 10:00 
    //         //     if (now.isAfter(scheduled_time)){
    //         //         console.log("4");
    //         //         return res.status(400).json({ message: 'Appointment time must be in the future - time' });
    //         // }
    //         // }
    //         // else if (new Date(req.body.date) < today_date) {
    //         //     return res.status(400).json({ message: 'Appointment time must be in the future - date' });
    //         // }

    //         // appointment time comparison
    //         const now = moment();
    //         const today_date = moment().startOf('day'); // Get current date as a moment object
            
    //         if (moment(req.body.date).isSame(today_date, 'day')) {
    //             const scheduled_time = moment(`${req.body.date} ${req.body.time}`, 'YYYY-MM-DD HH:mm'); // Include date
    //             if (now.isAfter(scheduled_time)) {
    //                 console.log("4");
    //                 return res.status(400).json({ message: 'Appointment time must be in the future - time' });
    //             }
    //         } else if (moment(req.body.date).isBefore(today_date, 'day')) {
    //             return res.status(400).json({ message: 'Appointment time must be in the future - date' });
    //         }
            
    //         if (req.body.status) { // to not let someone change status from pending to anything at the time of creation, if req contains status, it simply gets rejected
    //             return res.status(400).json({ message: "Cannot set status manually at creation" });
    //         }            
            
    //         const doctor_assigned = await DoctorModel.findById(doctor);
    //         if (!doctor_assigned) {
    //             return res.status(404).json({ message: 'Doctor not found' });
    //         }
    //         const patient_applied = await PatientModel.findById(patient);
    //         if (!patient_applied) {
    //             return res.status(404).json({ message: 'Patient not found' });
    //         }

    //         // appointment should be only between doctor.availability.startTime and scheduled time + duration < endTime
    //         // const doctor_availability = doctor_assigned.availability.find((availability) => availability.day === moment(date).format('dddd'));
    //         // if (!doctor_availability) {
    //         //     return res.status(400).json({ message: 'Doctor is not available on this day' });
    //         // }

    //         const appointmentDay = moment(date).format('dddd');
    //         console.log(appointmentDay);

    //         // Check if the day matches the doctor's availability
    //         const availability_day = doctor_assigned.availability.find((slot) => slot.day === appointmentDay);
    //         if (!availability_day) {
    //             return res.status(400).json({message: "The doctor is not available on this day." });
    //         }

    //         const appointmentStart = moment(time, 'HH:mm'); // appointment start time
    //         const appointmentEnd = appointmentStart.clone().add(duration, 'minutes'); // Adding duration to iy 

            
    //         const availabilityStart = moment(availability_day.startTime, 'HH:mm'); // doctpr start time on basis of that available day
    //         const availabilityEnd = moment(availability_day.endTime, 'HH:mm'); //end time of that day
    //         const graceEnd = availabilityEnd.add(10, 'minutes');
    //         const criticalEnd = availabilityEnd.clone().subtract(10, 'minutes');

    //         // Check if appointmentStart and appointmentEnd are within the availability window
    //         const isWithinAvailability = appointmentStart.isSameOrAfter(availabilityStart) &&
    //                                      appointmentEnd.isSameOrBefore(graceEnd) &&
    //                                      appointmentStart.isBefore(criticalEnd) ;

    //         if (!isWithinAvailability) {
    //             console.log('Appointment time does not fit within the doctor\'s available hours.');
    //             return res.status(400).json({ message: 'Appointment time does not fit within the doctor\'s available hours.' });
    //         } 


    //         const appointmentStart1 = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm'); // New appointment start
    //         const appointmentEnd1 = appointmentStart1.clone().add(duration, 'minutes'); // New appointment end
    //         // Check if the patient already has an appointment during the same time frame
    //         const existingPatientAppointment = await AppointmentModel.findOne({
    //             patient,
    //             date,
    //             status: { $ne: 'cancelled' }, // Excluding cancelled appointments
    //             $or: [
    //                 {
    //                     // Existing appointment ends after the new appointment starts
    //                     $and: [
    //                         { time: { $lte: appointmentEnd1.format('HH:mm') } },
    //                         { time: { $gte: appointmentStart1.format('HH:mm') } }
    //                     ]
    //                 },
    //                 {
    //                     // New appointment starts before the existing appointment ends
    //                     $and: [
    //                         { time: { $gte: appointmentStart1.format('HH:mm') } },
    //                         { time: { $lte: appointmentEnd1.format('HH:mm') } }
    //                     ]
    //                 }
    //             ]
    //         });

    //     if (existingPatientAppointment) {
    //         return res.status(400).json({ message: 'You already have an appointment booked during this time frame.' });
    //     }


    //     // Check for conflicting appointments with the doctor
    //     const existingDoctorAppointment = await AppointmentModel.findOne({
    //         doctor,
    //         date,
    //         status: { $in: ['confirmed', 'ongoing'] }, // Only check confirmed or ongoing appointments
    //         $or: [
    //             {
    //                 $and: [
    //                     { time: { $lte: appointmentEnd1.format('HH:mm') } },
    //                     { time: { $gte: appointmentStart1.format('HH:mm') } }
    //                 ]
    //             },
    //             {
    //                 $and: [
    //                     { time: { $gte: appointmentStart1.format('HH:mm') } },
    //                     { time: { $lte: appointmentEnd1.format('HH:mm') } }
    //                 ]
    //             }
    //         ]
    //     });

    //     if (existingDoctorAppointment) {
    //         return res.status(400).json({ message: 'The doctor already has an appointment booked during this time frame.' });
    //     }

    //     // Create the appointment
    //     const appointment = new AppointmentModel({
    //         doctor,
    //         patient,
    //         date,
    //         time,
    //         duration,
    //         endTime: appointmentEnd1.format('HH:mm'),
    //         mode_of_payment,
    //     });

    //         const savedAppointment = await appointment.save();
    //         if(savedAppointment)
    //         return res.status(201).json({ message: 'Appointment created successfully', appointment });
            
    //         else{
    //             return res.status(500).json({ message: 'Error creating appointment here' });
    //         }

    // }
    //     catch(err) {
    //         return res.status(500).json({ message: 'Error creating appointment', error: err });
    //     }
    // }