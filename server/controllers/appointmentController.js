const AppointmentModel = require('../models/appointmentModel');
const DoctorModel = require('../models/doctorModel');
const PatientModel = require('../models/patientModel');
const moment = require('moment');
const now = moment();

class AppointmentController {
    static async MakeAppointment(req, res) {
        const { doctorId:doctor, patientId:patient, date, time, duration, mode_of_payment} = req.body;
        console.log(req.body);

        try{
            if (!doctor || !patient || !date || !time || !duration || !mode_of_payment) {
               
                return res.status(400).json({ message: 'Please provide all required fields' });
            }
            
            // appointment time comparison
            const today_date = new Date().toISOString().split('T')[0]; // get current date in YYYY-MM-DD format

            if (new Date(req.body.date) == today_date) {
                const scheduled_time = moment(time, 'hh:mm'); // 10:00 
                if (now.isAfter(scheduled_time)){
                    console.log("4");
                    return res.status(400).json({ message: 'Appointment time must be in the future - time' });
            }
            }
            else if (new Date(req.body.date) < today_date) {
                return res.status(400).json({ message: 'Appointment time must be in the future - date' });
            }

            
            if (req.body.status) { // to not let someone change status from pending to anything at the time of creation, if req contains status, it simply gets rejected
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

            // appointment should be only between doctor.availability.startTime and scheduled time + duration < endTime
            // const doctor_availability = doctor_assigned.availability.find((availability) => availability.day === moment(date).format('dddd'));
            // if (!doctor_availability) {
            //     return res.status(400).json({ message: 'Doctor is not available on this day' });
            // }

            const appointmentDay = moment(date).format('dddd');
            console.log(appointmentDay);

            // Check if the day matches the doctor's availability
            const availability_day = doctor_assigned.availability.find((slot) => slot.day === appointmentDay);
            if (!availability_day) {
                return res.status(400).json({message: "The doctor is not available on this day." });
            }

            const appointmentStart = moment(time, 'HH:mm'); // appointment start time
            const appointmentEnd = appointmentStart.clone().add(duration, 'minutes'); // Adding duration to iy 
            const availabilityStart = moment(availability_day.startTime, 'HH:mm'); // doctpr start time on basis of that available day
            const availabilityEnd = moment(availability_day.endTime, 'HH:mm'); //end time of that day
            const graceEnd = availabilityEnd.add(10, 'minutes');

            // Check if appointmentStart and appointmentEnd are within the availability window
            const isWithinAvailability = appointmentStart.isSameOrAfter(availabilityStart) &&
                                         appointmentEnd.isSameOrBefore(graceEnd);

            if (!isWithinAvailability) {
                console.log('Appointment time does not fit within the doctor\'s available hours.');
                return res.status(400).json({ message: 'Appointment time does not fit within the doctor\'s available hours.' });
            } 

            const appointment = new AppointmentModel({
                doctor:doctor,
                patient:patient,
                date,
                time,
                duration,
                mode_of_payment
            });

            const existingAppointment = await AppointmentModel.findOne({ doctor,patient, date, time });
            if (existingAppointment) {
                return res.status(400).json({ message: 'You have already booked an Appointment for the scheduled time' });
            }

            const savedAppointment = await appointment.save();
            if(savedAppointment)
            return res.status(201).json({ message: 'Appointment created successfully', appointment });
            
            else{
                return res.status(500).json({ message: 'Error creating appointment here' });
            }

    }
        catch(err) {
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
