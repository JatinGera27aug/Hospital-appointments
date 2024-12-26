console.log(new Date());

const moment = require('moment');

// Current time
const now = moment(); // Automatically gets the current time
console.log('Current Time:', now.format('hh:mm A'));