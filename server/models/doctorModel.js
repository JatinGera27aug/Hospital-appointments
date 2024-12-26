const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: [0, "Years of experience must be at least 0"],
  },
  qualifications: {
    type: [String], // Array of qualifications, e.g., ["MBBS", "MD"]
    required: true,
  },
  availability: [
    {
      day: {
        type: String, //"Monday"
        required: true,
      },
      startTime: {
        type: String, //  "09:00"
        required: true,
      },
      endTime: {
        type: String, //  "17:00"
        required: true,
      },
    },
  ],
  contact: {
    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Invalid phone number"],
    },
    email: {
      type: String,
      required: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email address",
      ],
    },
  },
  clinicAddress: {
    type: String,
    required: true,
    default: ""
  },
  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  fees:
  {
    type: Number,
    required: true,
    min: 100,
 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Doctor", DoctorSchema);

