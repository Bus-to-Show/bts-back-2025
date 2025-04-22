require('dotenv').config(); // Load environment variables
const reminderEmails = require('./reminderEmails'); // Import the reminderEmails module

(async () => {
  try {
    console.log('Running sendReminders locally...');
    // Uncomment the line below to actually send reminder emails
    // This is commented out to prevent sending emails during testing
    //    I suggest overriding the email `to` field in the function BEFORE testing

    // await reminderEmails.sendReminders();
    console.log('sendReminders executed successfully.');
  } catch (error) {
    console.error('Error running sendReminders:', error);
  }
})();
