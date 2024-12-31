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


// const sendEmail = (to, subject, text) => {   // original to use
//     const mailOptions = {
//       from: process.env.EMAIL,  
//       to: 'hijat789@gmail.com', 
//       subject: subject, 
//       text: text, 
//     };
  
const sendEmail = ( subject, text) => { // test use
  const mailOptions = {
    from: process.env.EMAIL,  
    to: 'hijat789@gmail.com', 
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
// sendEmail('demo Subject2', 'Namaste from sender-again');
module.exports = sendEmail;
// export default sendEmail;
