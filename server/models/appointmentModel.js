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
  mode_of_payment:{
    type: String,
    enum: ["cash", "card", "upi", "netbanking"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed", "missed", "ongoing"],
    default: "pending",
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Appointment",
    default: null,
  },

}, { timestamps: true });

module.exports = mongoose.model("Appointment", AppointmentSchema);
