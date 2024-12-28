const AppointmentModel = require('../models/appointmentModel');
const DoctorModel = require('../models/doctorModel');
const PatientModel = require('../models/patientModel');
// const {checkAndUpdateMissedAppointments} = require('../utils/checkAppointments');
const moment = require('moment');
// const now = moment();

class AppointmentController {
        
    static async MakeAppointment(req, res) {
        const { doctorId: doctor, patientId: patient, date, time, duration, mode_of_payment } = req.body;
        console.log(req.body);
    
        try {
            if (!doctor || !patient || !date || !time || !duration || !mode_of_payment) {
                return res.status(400).json({ message: 'Please provide all required fields' });
            }
            const now = new Date(); // Current time
            const currentDateTimeInIndia = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
            const currentDateTime = new Date(currentDateTimeInIndia); // Parsed back to a Date object for consistency

            // Combine date and time for the appointment
            const scheduledDateTime = new Date(`${date}T${time}:00`); // Ensure full ISO format

            // Debugging logs for clarity
            console.log("Now (Local):", now);
            console.log("Current Date-Time in India:", currentDateTime);
            console.log("Scheduled Date-Time:", scheduledDateTime);

            // Check if the appointment is for today
            const todayInIndia = currentDateTime.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
            const scheduledDateInIndia = scheduledDateTime.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
            const scheduledTime = new Date(`${date}T${time}`);

            // Appointment logic
            if (scheduledDateInIndia === todayInIndia) {
                // If the appointment is for today, ensure the time is in the future
                if (scheduledDateTime <= currentDateTime) {
                    console.log("4");
                    return res.status(400).json({ message: 'Appointment time must be in the future - time' });
                }
            } else if (scheduledDateTime < currentDateTime) {
                // If the appointment date is in the past
                return res.status(400).json({ message: 'Appointment date must be in the future - date' });
            }

            // If all checks pass
            console.log("Appointment is valid and in the future.");


            // Appointment time comparison
            // if (appointmentDate.toDateString() === today.toDateString()) {
            //     if (scheduledTime <= now) {
            //         console.log("4");
            //         return res.status(400).json({ message: 'Appointment time must be in the future - time' });
            //     }
            // } else if (appointmentDate < today) {
            //     return res.status(400).json({ message: 'Appointment time must be in the future - date' });
            // }

            // If the appointment is for today, check if the time is in the future
            const appointmentDayInIndia = new Intl.DateTimeFormat('en-US', { 
                weekday: 'long', 
                timeZone: 'Asia/Kolkata' 
            }).format(scheduledDateTime);


            if (req.body.status) {
                return res.status(400).json({ message: "Cannot set status manually at creation" });
            }
    
            const doctor_assigned = await DoctorModel.findById(doctor);
            if (!doctor_assigned) {
                return res.status(404).json({ message: 'Doctor not found' });
            }
    
            const patient_applied = await PatientModel.findById(patient);
            if (!patient_applied) {
                return res.status(404).json({ message: 'Patient not found' });
            }
    
            
            const availability_day = doctor_assigned.availability.find((slot) => slot.day === appointmentDayInIndia);
            console.log(appointmentDayInIndia);
            if (!availability_day) {
                return res.status(400).json({ message: "The doctor is not available on this day." });
            }
    
            const availabilityStart = new Date(`${date}T${availability_day.startTime}`);
            const availabilityEnd = new Date(`${date}T${availability_day.endTime}`);
            availabilityEnd.setMinutes(availabilityEnd.getMinutes() + 10); // Adding 10 minutes grace period
    
            const appointmentEnd = new Date(scheduledTime);
            appointmentEnd.setMinutes(appointmentEnd.getMinutes() + duration); // Adding duration
    
            // Determine the critical end time (10 minutes before availabilityEnd)
            const criticalEnd = new Date(availabilityEnd);
            criticalEnd.setMinutes(criticalEnd.getMinutes() - 10); // Subtracting 10 minutes

            // Check if appointmentStart and appointmentEnd are within the availability window
            const isWithinAvailability = scheduledTime >= availabilityStart &&
                                        appointmentEnd <= availabilityEnd &&
                                        scheduledTime < criticalEnd;

            if (!isWithinAvailability) {
                console.log('Appointment time does not fit within the doctor\'s available hours.');
                return res.status(400).json({ message: 'Appointment time does not fit within the doctor\'s available hours.' });
            }
    
            // Check for existing patient appointments
            const existingPatientAppointment = await AppointmentModel.findOne({
                patient,
                date,
                status: { $ne: 'cancelled' },
                $or: [
                    {
                        // Existing appointment ends after the new appointment starts
                        $and: [
                            { time: { $lte: appointmentEnd.toTimeString().split(' ')[0] } }, // Format to HH:mm
                            { time: { $gte: scheduledTime.toTimeString().split(' ')[0] } }
                        ]
                    },
                    {
                        // New appointment starts before the existing appointment ends
                        $and: [
                            { time: { $gte: scheduledTime.toTimeString().split(' ')[0] } },
                            { time: { $lte: appointmentEnd.toTimeString().split(' ')[0] } }
                        ]
                    },
                    {
                        // Check using the new endTime field
                        $and: [
                            { endTime: { $gte: scheduledTime.toTimeString().split(' ')[0] } }, // Existing appointment's end time should be after new appointment starts
                            { endTime: { $lte: appointmentEnd.toTimeString().split(' ')[0] } } // Existing appointment's end time should be before new appointment ends
                        ]
                    }
                ]
            });
    
            if (existingPatientAppointment) {
                return res.status(400).json({ message: 'You already have an appointment booked during this time frame.' });
            }
    
            // Check for conflicting appointments with the doctor
            const existingDoctorAppointment = await AppointmentModel.findOne({
                doctor,
                date,
                status: { $in: ['confirmed', 'ongoing'] },
                $or: [
                    {
                        $and: [
                            { endTime: { $gte: scheduledTime.toTimeString().split(' ')[0] } }, // Existing appointment's end time should be after new appointment starts
                            { endTime: { $lte: appointmentEnd.toTimeString().split(' ')[0] } } // Existing appointment's end time should be before new appointment ends
                        ]
                    },
                    {
                        $and: [
                            { time: { $gte: scheduledTime.toTimeString().split(' ')[0] } },
                            { time: { $lte: appointmentEnd.toTimeString().split(' ')[0] } }
                        ]
                    }
                ]
            });
    
            if (existingDoctorAppointment) {
                return res.status(400).json({ message: 'The doctor already has an appointment booked during this time frame.' });
            }
    
            // Create the appointment including endTime
            const appointment = new AppointmentModel({
                doctor,
                patient,
                date,
                time,
                duration,
                endTime: appointmentEnd.toTimeString().split(' ')[0], // Include endTime
                mode_of_payment,
            });
    
            const savedAppointment = await appointment.save();
            if (savedAppointment) {
                return res.status(201).json({ message: 'Appointment created successfully', appointment });
            } else {
                return res.status(500).json({ message: 'Error creating appointment here' });
            }
    
        } catch (err) {
            console.error('Error creating appointment:', err); // Log the error for debugging
            return res.status(500).json({ message: 'Error creating appointment', error: err });
        }
    }
    
    //get all appointments

    static async getAllAppointments(req,res){
            try {
                const appointments = await AppointmentModel.find()
                    .populate('doctor', 'name specialization fees') 
                    .populate('patient', 'username email phone dob'); 
        
                res.status(200).json({ appointments });
            } catch (err) {
                console.error('Error fetching appointments:', err.message);
                res.status(500).json({ message: 'Error fetching appointments', error: err.message });
            }
        }

        //get appointment of specific doctor
        static async getAppointmentByDoctor(req, res) {
            try {
                const doctorId = req.params.doctorId;
        
                // Checking even doctor exists or not in db
                const doctorExists = await DoctorModel.findById(doctorId);
                if (!doctorExists) {
                    return res.status(404).json({ message: 'Doctor not found' });
                }
        
                const appointments = await AppointmentModel.find({ doctor: doctorId })
                    .populate('doctor', 'name specialization fees')
                    .populate('patient', 'username email phone dob');
        
                if (!appointments || appointments.length === 0) {
                    return res.status(404).json({ message: 'No appointments found for the specified doctor' });
                }
        
                res.status(200).json({ appointments });
            } catch (err) {
                console.error('Error fetching appointments:', err.message);
                res.status(500).json({ message: 'Error fetching appointments', error: err.message });
            }
        }


        //get appointment of specific patient
        static async getAppointmentByPatient(req, res) {
            try {
                const patientId = req.params.patientId;
        
                // Checking even patient exists or not in db
                const patientExists = await PatientModel.findById(patientId);
                if (!patientExists) {
                    return res.status(404).json({ message: 'patient not found' });
                }
        
                const appointments = await AppointmentModel.find({ patient: patientId })
                    .populate('doctor', 'name specialization fees')
                    .populate('patient', 'username email phone'); // did not include dob as details are repetitve and will increase memory usage
        
                if (!appointments || appointments.length === 0) {
                    return res.status(404).json({ message: 'No appointments found for the specified patient' });
                }
        
                res.status(200).json({ appointments });
            } catch (err) {
                console.error('Error fetching appointments:', err.message);
                res.status(500).json({ message: 'Error fetching appointments', error: err.message });
            }
        }


        //get all pending appointments
        static async getAllPendingAppointments(req, res) {
             try {
                const pendingAppointments = await AppointmentModel.find({ status: 'pending' })
                    .populate('doctor', 'name specialization fees')
                    .populate('patient', 'username email phone');
        
                if (pendingAppointments.length === 0 || !pendingAppointments) {
                    return res.status(404).json({ message: 'No pending appointments found' });
                }

                res.status(200).json({ appointments: pendingAppointments });
             }
             catch(err){
                return res.status(500).json({ message: 'Error fetching pending appointments', error: err.message });
             }
        }



        // fetching pending appointments to each doctor
        static async getPendingAppointmentsDoc(req, res) {
            try {
                const doctorId = req.params.doctorId;
                
                const isdoctor = await DoctorModel.findById(doctorId);
                if (!isdoctor) {
                    return res.status(404).json({ message: 'Doctor not found.' });
                }

                const pendingAppointments = await AppointmentModel.find({
                    doctor: doctorId,
                    status: 'pending',
                })
                    .populate('patient', 'username email phone')
                    .populate('doctor', 'name specialization fees');
        
                if (!pendingAppointments.length) {
                    return res.status(404).json({ message: 'No pending appointments found for this doctor. He is just A CHILL GUY NOW!' });
                }
        
                res.status(200).json({ appointments: pendingAppointments });
            } catch (err) {
                console.error('Error fetching pending appointments:', err.message);
                res.status(500).json({ message: 'Error fetching pending appointments', error: err.message });
            }
        }

        // fetching pending appointments of each patient
        static async getPendingAppointmentsPatient(req, res) {
            try {
                const patientId = req.params.patientId;
        
                const pendingAppointments = await AppointmentModel.find({
                    patient: patientId,
                    status: 'pending',
                })
                    .populate('patient', 'username email phone')
                    .populate('doctor', 'name specialization fees');
        
                if (!pendingAppointments.length) {
                    return res.status(404).json({ message: 'No pending appointments found for this patient. He is just A CHILL GUY NOW!' });
                }
        
                res.status(200).json({ appointments: pendingAppointments });
            } catch (err) {
                console.error('Error fetching pending appointments:', err.message);
                res.status(500).json({ message: 'Error fetching pending appointments', error: err.message });
            }
        }


        // pending to confirmed status (done from doc side)
        static async confirmAppointment(req, res) {
            try {
                const { doctorId, appointmentId } = req.params;
                // const appointmentId = req.params.appointmentId;

                const isdoctor = await DoctorModel.findById(doctorId);
                if (!isdoctor) {
                    return res.status(404).json({ message: 'Doctor not found.' });
                }

                const appointment = await AppointmentModel.findById(appointmentId);
                // console.log(appointment.doctor._id);
                if (!appointment) {
                    return res.status(404).json({ message: 'Appointment not found.' });
                }

                if (appointment.doctor._id.toString() !== doctorId) {
                    return res.status(403).json({ message: 'You are not authorized to confirm this appointment.' });
                }

                if (appointment.status !== 'pending') {
                    return res.status(400).json({ message: 'Only pending appointments can be confirmed.' });
                }
        
                appointment.status = 'confirmed';
                await appointment.save();
        
                res.status(200).json({
                    message: 'Appointment confirmed successfully.',
                    appointment,
                });

                // email notification to patient pending -- not necessary
                //
            } catch (err) {
                console.error('Error confirming appointment:', err.message);
                res.status(500).json({ message: 'Error confirming appointment', error: err.message });
            }
        }


        //cancelling appointment (done from patient side)
         static async cancelAppointmentByPatient(req, res) {
              try {
                const { appointmentId, patientId } = req.params;

                const isPatient = await PatientModel.findById(patientId);
                if (!isPatient) {
                    return res.status(404).json({ message: 'Patient not found.' });
                }

                const appointment = await AppointmentModel.findById(appointmentId);
                if (!appointment) {
                    return res.status(404).json({ message: 'Appointment not found.' });
                }
                if (appointment.status !== 'pending') {
                    return res.status(400).json({ message: 'Only pending appointments can be cancelled.' });
                }

                appointment.status = 'cancelled';
                await appointment.save();

                res.status(200).json({
                    message: 'Appointment cancelled successfully.',
                    appointment,
                });

                // email notification to doc pending -- not necessary
                //
              }
        
              catch (err) {
                  console.error('Error cancelling appointment:', err.message);
                  res.status(500).json({ message: 'Error cancelling appointment', error: err.message });
              }
            }
         

            //cancelling appointment (done from doctor side)
         static async cancelAppointmentByDoctor(req, res) {
            try {
              const { appointmentId, doctorId } = req.params;

              const isdoctor = await DoctorModel.findById(doctorId);
              if (!isdoctor) {
                  return res.status(404).json({ message: 'Doctor not found.' });
              }

              const appointment = await AppointmentModel.findById(appointmentId);
              if (!appointment) {
                  return res.status(404).json({ message: 'Appointment not found.' });
              }

              if (appointment.doctor._id.toString() !== doctorId) {
                return res.status(403).json({ message: 'You are not authorized to cancel this appointment.' });
            }

              if (!appointment.status == 'pending' || !appointment.status == 'confirmed') {
                  return res.status(400).json({ message: 'Unable to cancel, either ongoing or missed' });
              }

              appointment.status = 'cancelled';
              await appointment.save();

              res.status(200).json({
                  message: 'Appointment cancelled successfully.',
                  appointment,
              });

              // email notification to pat pending -- not necessary
              //
            }
      
            catch (err) {
                console.error('Error cancelling appointment:', err.message);
                res.status(500).json({ message: 'Error cancelling appointment', error: err.message });
            }
          }
        
        
          // fetching confirmed appointments of each doctor
        static async getConfirmedAppointmentsDoc(req, res) {
            try {
                const doctorId = req.params.doctorId;
                
                const isdoctor = await DoctorModel.findById(doctorId);
                if (!isdoctor) {
                    return res.status(404).json({ message: 'Doctor not found.' });
                }

                const confirmedAppointments = await AppointmentModel.find({
                    doctor: doctorId,
                    status: 'confirmed',
                })
                    .populate('patient', 'username email phone')
                    .populate('doctor', 'name specialization fees');
        
                if (!confirmedAppointments.length) {
                    return res.status(404).json({ message: 'No confirmed appointments found for this doctor. He is just A CHILL GUY NOW!' });
                }
        
                res.status(200).json({ appointments: confirmedAppointments });
            } catch (err) {
                console.error('Error fetching confirmed appointments:', err.message);
                res.status(500).json({ message: 'Error fetching confirmed appointments', error: err.message });
            }
        }


        //confirm to ongoing appointment (done from doctor side)
        static async OngoingAppointmentByDoctor(req, res) {
            try {
              const { doctorId, appointmentId } = req.params;

              const isdoctor = await DoctorModel.findById(doctorId);
              if (!isdoctor) {
                  return res.status(404).json({ message: 'Doctor not found.' });
              }

              const appointment = await AppointmentModel.findById(appointmentId);
              if (!appointment) {
                  return res.status(404).json({ message: 'Appointment not found.' });
              }

              // validating alloted doctor only is able to done this operation
              if (appointment.doctor._id.toString() !== doctorId) {
                return res.status(403).json({ message: 'You are not authorized to confirm this appointment.' });
             }

              if (!appointment.status == 'confirmed') {
                  return res.status(400).json({ message: "Appointment is either pending or not confirmed" });
              }

              appointment.status = 'ongoing';
              await appointment.save();

              res.status(200).json({
                  message: 'Appointment is ongoing.',
                  appointment,
              });

            }
      
            catch (err) {
                console.error('Error to mark appointmed as ongoing:', err.message);
                res.status(500).json({ message: 'Error to mark appointmed as ongoing', error: err.message });
            }
          }


          // manual marking of completion of appointment (done from doctor side)
          static async completeAppointmentByDoctor(req, res) {
            try {
                const { doctorId, appointmentId } = req.params;
  
                const isdoctor = await DoctorModel.findById(doctorId);
                if (!isdoctor) {
                    return res.status(404).json({ message: 'Doctor not found.' });
                }
  
                const appointment = await AppointmentModel.findById(appointmentId);
                if (!appointment) {
                    return res.status(404).json({ message: 'Appointment not found.' });
                }
  
                // validating alloted doctor only is able to done this operation
                if (appointment.doctor._id.toString() !== doctorId) {
                  return res.status(403).json({ message: 'You are not authorized to mark complete to appointment.' });
               }
  
                if (!appointment.status == 'ongoing') {
                    return res.status(400).json({ message: "Appointment is either not ongoing or is missed" });
                }
  
                appointment.status = 'completed';
                await appointment.save();
  
                res.status(200).json({
                    message: 'Appointment is completed.',
                    appointment,
                });
  
              }
        
              catch (err) {
                  console.error('Error on making appointment as complete:', err.message);
                  res.status(500).json({ message: 'Error on making appointment as complete', error: err.message });
              }
            }


            // getting completed appointmet of each doctor
        static async getCompletedAppointmentsDoc(req, res) {
            try {
                const doctorId = req.params.doctorId;
                
                const isdoctor = await DoctorModel.findById(doctorId);
                if (!isdoctor) {
                    return res.status(404).json({ message: 'Doctor not found.' });
                }

                const completedAppointments = await AppointmentModel.find({
                    doctor: doctorId,
                    status: 'completed',
                })
                    .populate('patient', 'username email phone')
                    .populate('doctor', 'name specialization fees');
        
                if (!completedAppointments.length) {
                    return res.status(404).json({ message: 'No completed appointments found for this doctor. He is not A CHILL GUY NOW!' });
                }
        
                res.status(200).json({ appointments: completedAppointments });
            } catch (err) {
                console.error('Error fetching completed appointments:', err.message);
                res.status(500).json({ message: 'Error fetching completed appointments', error: err.message });
            }
        }


        // get all missed appointments of each doctor
        
        static async getMissedAppointmentsDoc(req, res) {
            try {
                const doctorId = req.params.doctorId;
                
                const isdoctor = await DoctorModel.findById(doctorId);
                if (!isdoctor) {
                    return res.status(404).json({ message: 'Doctor not found.' });
                }

                const missedAppointments = await AppointmentModel.find({
                    doctor: doctorId,
                    status: 'missed',
                })
                    .populate('patient', 'username email phone')
                    .populate('doctor', 'name specialization fees');
        
                if (!missedAppointments.length) {
                    return res.status(404).json({ message: 'No missed appointments found for this doctor. He is just A CHILL GUY NOW!' });
                }
        
                res.status(200).json({ appointments: missedAppointments });
            } catch (err) {
                console.error('Error fetching missed appointments:', err.message);
                res.status(500).json({ message: 'Error fetching missed appointments', error: err.message });
            }
        }

        // get all missed appointments of each patient
        
        static async getMissedAppointmentsPat(req, res) {
            try {
                const patientId = req.params.patientId;
                
                const ispatient = await PatientModel.findById(patientId);
                if (!ispatient) {
                    return res.status(404).json({ message: 'Patient not found.' });
                }

                const missedAppointments = await AppointmentModel.find({
                    patient: patientId,
                    status: 'missed',
                })
                    .populate('patient', 'username email phone')
                    .populate('doctor', 'name specialization fees');
        
                if (!missedAppointments.length) {
                    return res.status(404).json({ message: 'No missed appointments found for this patient. He is just A CHILL GUY ' });
                }
        
                res.status(200).json({ appointments: missedAppointments });
            } catch (err) {
                console.error('Error fetching missed appointments:', err.message);
                res.status(500).json({ message: 'Error fetching missed appointments for patient', error: err.message });
            }
        }

        // find slots
        static async FindSlotsforRescheduling(req, res) {
            try {
                // const doctorId = req.params.doctorId;
                const appointmentId = req.params.appointmentId;

                const appointment = await AppointmentModel.findById(appointmentId);
                if (!appointment) {
                    return res.status(404).json({ message: 'No such appointment was made earlier' });
                }
                console.log(appointment);

                if (appointment.status !== 'missed') {
                    return res.status(400).json({ message: 'You can only reschedule missed appointments' });
                }
                // doctor ko check krna jaruri nhi , kyuki missed state se aya hain to obv pehle sb confirm wagera ho rkha hpga
                const doctor_info = appointment.doctor;
                const appointment_duration = appointment.duration;
                const appointment_date = appointment.date;

                const doctor_whole_info = await DoctorModel.findById(doctor_info);
                // console.log(doctor_whole_info);
                const doctor_availability = doctor_whole_info.availability;
                console.log(doctor_availability);
                const doctor_confirm_app = await AppointmentModel.find({ doctor: doctor_info, status: 'confirmed', date: appointment_date });
                // console.log(doctor_confirm_app);
                console.log(doctor_confirm_app.length);

                // doctor_slice = doctor_confirm_app.slice(2);
                if (doctor_confirm_app.length == 0){
                    // update appointment time to doctor start time
                    const doctor_start_time = doctor_availability.startTime; // chaiye par sirf usi din ka , wo wali condition lgegi
                    
                    appointment.time = doctor_start_time;
                    await appointment.save();
                    return res.status(200).json({ message: 'Appointment time updated to doctor start time' });
                }
                else if (doctor_confirm_app.length > 0) {
                    // Sort appointments by end time (time + duration) in ascending order
                    
                        const calculateEndTime = (time, duration) => {
                            // Ensure time is in the correct format
                            const timeParts = time.split(':');
                            let hours = parseInt(timeParts[0], 10);
                            let minutes = parseInt(timeParts[1], 10);

                            // Add the duration to minutes
                            minutes += duration;

                            // Handle overflow: convert excess minutes to hours
                            hours += Math.floor(minutes / 60);
                            minutes = minutes % 60;

                            // Format hours and minutes to always have two digits
                            const formattedHours = hours.toString().padStart(2, '0');
                            const formattedMinutes = minutes.toString().padStart(2, '0');
                            return `${formattedHours}:${formattedMinutes}`;
                    };

                    // Sort appointments by their calculated end time
                    // const sortedAppointments = doctor_confirm_app.sort((a, b) => {
                    //     // Calculate end times for both appointments
                    //     const endA = calculateEndTime(a.time, a.duration);
                    //     const endB = calculateEndTime(b.time, b.duration);

                    //     // Debug logs to verify computed end times
                    //     console.log(`Appointment A: ${a._id}, End Time: ${endA}`);
                    //     console.log(`Appointment B: ${b._id}, End Time: ${endB}`);

                    //     // Compare end times for sorting
                    //     return endA.localeCompare(endB);
                    // });
                    // Update endTime field if it is null and sort appointments
                    const sortedAppointments = doctor_confirm_app.map((appointment) => {
                        if (!appointment.endTime) {
                            appointment.endTime = calculateEndTime(appointment.time, appointment.duration);
                        }
                        return appointment;
                    }).sort((a, b) => a.endTime.localeCompare(b.endTime)); // Sort by updated endTime

                    console.log('Sorted Appointments:', sortedAppointments);
                    
                    // Get the last appointment (since it's sorted in ascending order)
                    const lastAppointment = sortedAppointments[sortedAppointments.length - 1];
                    console.log('Last Appointment:', lastAppointment.endTime);

                    // Calculate the next available slot (last appointment's end time)
                    // Calculate next available slot
                    
                    const nextAvailableTime = calculateEndTime(lastAppointment.endTime, 5); // Add a 5-minute buffer
                    console.log('Next Available Time:', nextAvailableTime);


                    // doctor's endTimev or not, whole function

                    // Function to get the day of the week in India
                    const getDayInIndia = (date) => {
                        return new Intl.DateTimeFormat('en-US', { 
                            weekday: 'long', 
                            timeZone: 'Asia/Kolkata' 
                        }).format(date);
                    };

                    // const dayInIndia = getDayInIndia(appointment_date); // day acc to date
                    // console.log('Day in India:', dayInIndia);

                    const getDoctorEndTime = (appointment_date, doctor_availability) => {
                        // Convert the appointment_date string to a Date object
                        const scheduledDateTime = new Date(appointment_date);
                    
                        // Get the day of the week in India
                        const appointmentDayInIndia = getDayInIndia(scheduledDateTime);
                        console.log('Day in India:', appointmentDayInIndia);
                    
                        // Find the availability entry for the appointment day
                        const doctorAvailabilityForDay = doctor_availability.find(
                            (availability) => availability.day === appointmentDayInIndia
                        );
                    
                        if (!doctorAvailabilityForDay) {
                            console.log(`Doctor is not available on ${appointmentDayInIndia}`);
                            return null;
                        }

                         // Format the date portion of appointment_date to YYYY-MM-DD
                        const formattedDate = scheduledDateTime.toISOString().split('T')[0];

                        // Combine the date with the doctor's endTime
                        const doctorEndTime = new Date(`${formattedDate}T${doctorAvailabilityForDay.endTime}`);


                        if (isNaN(doctorEndTime.getTime())) {
                            console.error('Invalid doctor end time:', doctorAvailabilityForDay.endTime);
                            return null;
                        }

                        console.log('Doctor End Time:', doctorEndTime.toISOString());
                        return doctorEndTime;
                    };

                    const doctor_end_time = getDoctorEndTime(appointment_date, doctor_availability); // calling the main logic func

                    const doctor_end_time_in_local = doctor_end_time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    if (doctor_end_time) {
                        console.log('Doctor End Time in Local Format:', doctor_end_time_in_local);
                    }



                    const formatDoctorEndTime = (doctorEndTime) => {
                        const localTime = new Date(doctorEndTime).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false // Use 24-hour format
                        });
                    
                        // Extract hours and minutes
                        const [hours, minutes] = localTime.split(':');
                    
                        // Return formatted time as "HH:mm"
                        return `${hours}:${minutes}`;
                    };
                    console.log('formatted doctor end time in hours:mm', formatDoctorEndTime(doctor_end_time));

                    const formattedDoctorEndTime = formatDoctorEndTime(doctor_end_time);

                    // comapring formatted doctor end time and available slot
                    const compareTimes = (nextAvailableTime, doctorEndTime) => {
                        // Extract the time parts for both
                        const nextAvailableParts = nextAvailableTime.split(':');
                        const doctorEndParts = doctorEndTime.split(':');
                    
                        // Convert time to minutes for easier comparison
                        const nextAvailableMinutes = parseInt(nextAvailableParts[0], 10) * 60 + parseInt(nextAvailableParts[1], 10);
                        const doctorEndMinutes = parseInt(doctorEndParts[0], 10) * 60 + parseInt(doctorEndParts[1], 10);
                        console.log('next available minutes', nextAvailableMinutes);
                        console.log('doctor end minutes', doctorEndMinutes);
                    
                        // Compare the times
                        return nextAvailableMinutes < doctorEndMinutes;
                    };

                    // calling with conditions

                    if (compareTimes(nextAvailableTime, formattedDoctorEndTime)) {
                        console.log('Next Available Slot:', nextAvailableTime);
                        console.log('Doctor is free from:', nextAvailableTime, 'to', formattedDoctorEndTime);
                        return res.status(200).json({ 
                                    message: 'Doctor is free from next available slot to doctor end time', 
                                    nextAvailableTime,
                                    formattedDoctorEndTime
                                });
                    } 
                     // shift to next days
                    else {

                        const scheduledDateTime = new Date(appointment_date);
                        const appointmentDayInIndia = getDayInIndia(scheduledDateTime);

                        const currentDayIndex = doctor_availability.findIndex(day => day.day === appointmentDayInIndia);
                        for (let i = 1; i < doctor_availability.length; i++) {
                            const nextAvailableDayIndex = (currentDayIndex + i) % doctor_availability.length; 
                            const doctorAvailabilityForNextDay = doctor_availability[nextAvailableDayIndex];
                    
                            if (doctorAvailabilityForNextDay && doctorAvailabilityForNextDay.startTime && doctorAvailabilityForNextDay.endTime) {
                                // Use the next available day's information to calculate the next slot
                                console.log(`Checking availability for day: ${doctorAvailabilityForNextDay.day}`);
                    
                                const lastConfirmedSlotNextDay = findLastConfirmedSlotForDay(
                                    doctorAvailabilityForNextDay,
                                    scheduledDateTime
                                );}}

                        console.log('No available slots within the doctor\'s working hours.');
                        return res.status(400).json({ 
                            message: 'No available slots left for rescheduling on this date' 
                        });
                        
                    }      
                
                    
                    }
            }
            catch(err){
                console.error('Error fetching slots:', err.message);
                res.status(500).json({ message: 'Error fetching slots', error: err.message });
            }
        }


}


module.exports = AppointmentController;

// const patient = await Patient.findById(patientId).populate('appointments.doctor');
// console.log(patient.appointments); // Array of appointments

// // adding
// const Patient = require('./path/to/patientModel');

// async function addAppointment(patientId, appointmentData) {
//   const patient = await Patient.findById(patientId);
//   if (!patient) throw new Error('Patient not found');

//   patient.appointments.push(appointmentData);

//   await patient.save();
//   console.log('Appointment added:', patient);
// }


// removing 
// const patient = await Patient.findById(patientId);
// if (!patient) throw new Error('Patient not found');

// // Filter out the appointment you want to remove
// patient.appointments = patient.appointments.filter(
//   (appointment) => appointment._id.toString() !== appointmentId
// );

// await patient.save();
// console.log('Appointment removed');
