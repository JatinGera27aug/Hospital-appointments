const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [4, "Password must be at least 4 characters long"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    // match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
  },
  dob: {
    type: Date,
    required: [true, "Date of Birth is required"],
  },
}, { timestamps: true });

module.exports = mongoose.model("Patient", PatientSchema);
