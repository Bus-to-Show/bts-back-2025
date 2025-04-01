const nodemailer = require('nodemailer');
const EMAIL_PASS = process.env.EMAIL_PASS;

// 
const sendEmailConfirmation = async (email, context, token, origin) => {
  console.log('sendEmailConfirmation origin   =====> ', origin)
  //context: 'reset' | 'confirm'

  // Set up the transporter object using your email provider's SMTP server
  const transporter = await nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'updates@bustoshow.org',
      pass: EMAIL_PASS
    }
  });

  // Define the email options
  const mailOptions = {
    from: 'updates@bustoshow.org',
    to: email,
    subject: `${context === 'confirm' ? 'Bus to Show Email Confirmation' : 'Bus to Show Password Reset'}`,
    text: `${context === 'confirm'
      ? `Thank you for registering! Please click the following link to confirm your email address: ${origin}/verify/${token}`
      : `A password reset was requested for this Bus to Show account. If you do not want to reset, then great, you are already done not resetting. 
              If you do want to reset it, please click the following link to confirm the request. ${origin}/reset/${token}`
      }`
  };

  // Send the email

  try {
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({
          'message': 'email failed to send',
          'code': '500',
          'email': `${email}`
        });
      } else {
        console.log(`Email sent: ${info.response}`);
        return res.status(200).json({
          'message': 'email sent!',
          'code': '200',
          'email': `${email}`
        })
      }
    });
  } catch (err) {
    if (err) {
      console.error(err)
      return false;
    }
  }
}

module.exports = { sendEmailConfirmation }
