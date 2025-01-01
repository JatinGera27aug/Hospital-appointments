const PatientModel = require('../models/patientModel');

class PatientController {

    // get all patients
    static async getAllPatients(req, res){
        try {
            const patients = await PatientModel.find();
            return res.status(200).json(patients);
        } catch (err) {
            return res.status(500).json(err);
        }
    }


    // get single patient
    static async getPatientbyId (req, res) {
        const id = req.params.id;
        try {
            const patient = await PatientModel.findById(id);
            return res.status(200).json(patient);
        } catch (err) {
            return res.status(500).json(err);
        }
    }


    // adding a patient
    static async addPatient(req, res) {
        const { username, email, password,phone, address, dob } = req.body;
        
        try {
            if (!username || !email || !password || !phone || !address || !dob ) {
                return res.status(400).json({ message: 'Please fill in all fields' });
            }

            //checking other conditions
            const existingPatient = await PatientModel.findOne({ email });
            if (existingPatient) {
                return res.status(400).json({ message: 'Patient already exists - Already used email' });
            }
            else{
                const existing_phone = await PatientModel.findOne({ phone });
                  if (existing_phone) {
                   return res.status(400).json({ message: 'Patient already exists - Already used phone' });
                  }
            }
            
            const newPatient = new PatientModel(req.body);
            const savedPatient = await newPatient.save();
            if(savedPatient)
            return res.status(200).json(savedPatient);
            else{
                return res.status(500).json({ message: 'Error saving patient' });
            }
        } catch (err) {
            return res.status(500).json(err);
        }
    }
}




module.exports = PatientController;
