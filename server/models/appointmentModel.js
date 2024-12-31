const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {   // sirf time hi 
    type: String,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  endTime:{
    type: String,
    default: null
  },
  mode_of_payment:{
    type: String,
    enum: ["cash", "card", "upi", "netbanking"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed", "missed", "ongoing", "rescheduled"],
    default: "pending",
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Appointment",
    default: null,
  },
  reason:{
    type: String,
    default: null,
  }

}, { timestamps: true });


// Middleware to calculate endTime
// AppointmentSchema.pre('save', function (next) {
//   if (this.time && this.duration) {
//       const appointmentStart = moment(this.time, 'HH:mm');
//       this.endTime = appointmentStart.add(this.duration, 'minutes').format('HH:mm');
//   }
//   next();
// });

module.exports = mongoose.model("Appointment", AppointmentSchema);
