const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config()
const helmet = require('helmet');

app.use(express.json());
app.set(express.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors());
app.use(helmet());
const connectDB = require('./config/dbMongo.js');  // provide db url in .env file
connectDB();

const { checkAndUpdateMissedAppointments } = require('./utils/checkAppointments');
const cron = require('node-cron');

cron.schedule('*/50 * * * *', async () => { // Runs every 5 minutes
    try {
        await checkAndUpdateMissedAppointments();
    } catch (error) {
        console.error('Error running cron job:', error);
    }
});

// global error handler
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};

app.use(errorHandler);

// const sampleRoutes = require('./routes/sampleRoutes.js')
const hospitalRoutes = require('./routes/doctorRoutes.js')
const patientRoutes = require('./routes/patientRoutes.js')
const appointmentRoutes = require('./routes/appointmentRoutes.js')

const PORT = 8000 || process.env.PORT;

app.get('/', (req, res) => res.send('HELLO WORLD'));

app.use('/api/doctor',hospitalRoutes)
app.use('/api/patient',patientRoutes)
app.use('/api/appointment',appointmentRoutes)

app.listen(PORT, () => {
    console.log("Server is running at http://localhost:8000");
});