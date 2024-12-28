const nodemailer = require('nodemailer');
require('dotenv').config(); 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,  
  },
});
// console.log(process.env.EMAIL, process.env.EMAIL_PASSWORD)

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL,  
    to: to, 
    subject: subject, 
    text: text, 
  };


  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error); 
      }
      resolve(info);
    });
  });
};
sendEmail('hijat789@gmail.com', 'demo Subject1', 'Namaste from sender-firse');
module.exports = sendEmail;
