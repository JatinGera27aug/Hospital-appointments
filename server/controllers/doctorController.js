const DoctorModel = require('../models/doctorModel.js')

class DoctorController {
    static async getAllDoctors(req, res) {
  
        try {
            const Alldoctors = await DoctorModel.find();
            return res.status(200).json(Alldoctors);
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    static async addNewDoctor(req, res) {

        try{
            const { name, specialization, yearsOfExperience, qualifications} = req.body;
                
            if (!name || !specialization || yearsOfExperience == null || !qualifications) {
                return res.status(400).json({ message: "All fields are required." });
            }
            if (typeof name !== 'string' || typeof specialization !== 'string') {
                return res.status(400).json({ message: "Invalid input." });
            }

            if (typeof yearsOfExperience !== 'number' || yearsOfExperience < 0) {
                return res.status(400).json({ message: "Invalid years of experience." });
            }

            // logic to check duplicate
            const existingDoctor = await DoctorModel.findOne({ name, specialization });
            if (existingDoctor) {
            return res.status(400).json({ message: "Doctor already exists." });
            }

            const newDoctor = new DoctorModel(req.body); 
            await newDoctor.save();

            return res.status(201).json({ message: "Doctor added successfully.", doctor: newDoctor });
        }
    
        catch (err) {
            res.status(500).json({ message: err.message })
        }
    }

    static async getDoctorById(req, res) {
        const doctorId = req.params.doctorId;
        try {
            
            const doctor = await DoctorModel.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({ message: "Doctor not found." });
            }
            res.status(200).json(doctor);
        }
        catch (err) {
            
        }
    }

    static async updateDoctor(req, res) {
        const doctorId = req.params.doctorId;
        const updateData = req.body;
      
        try {
          const updatedDoctor = await DoctorModel.findByIdAndUpdate(
            doctorId,
            updateData,
            { new: true, runValidators: true } // Return updated document and apply validators
          );
      
          if (!updatedDoctor) {
            return res.status(404).json({ error: "Doctor not found" }); // Send 404 response
          }
      
          return res.status(200).json(updatedDoctor); // Send updated doctor as response
        } catch (error) {
          return res.status(500).json({ error: error.message }); // Send error response
        }
      };
      

    static async deleteDoctor(req, res) {
        const doctorId = req.params.doctorId;
        try {
            const doctor = await DoctorModel.findByIdAndDelete(doctorId);
            if (!doctor) {
                return res.status(404).json({ message: "Doctor not found." });
            }
            return res.status(200).json({ message: "Doctor deleted successfully." });
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
        
    }
}

module.exports = DoctorController;