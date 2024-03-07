const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../config/logger");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(config.sendgrid.apiKey);

const sendEmail = async (to, subject, text) => {
  const msg = {
    to, // Recipient's email address
    from: config.sendgrid.send_email, // Your verified sender
    subject,
    text,
  };
  try {
    await sgMail.send(msg);
    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.warn(`Unable to send email to ${to}. Error: ${error.message}`);
    throw error; // Propagate the error if needed
  }
};

const sendResetPasswordEmail = async (to, token) => {
  const subject = "Reset password";
  const resetPasswordUrl = `${config.clientURL}/auth/reset-password?token=${token}`;
  const text = `Dear user,
  To reset your password, click on this link: ${resetPasswordUrl}
  If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendEmailVerificationEmail = async (to, token) => {
  const subject = "Verify email";
  const verifyEmailUrl = `${config.clientURL}/verify-email?token=${token}`;
  const text = `Dear user,
  To verify your email, click on this link: ${verifyEmailUrl}
  If you did not sign up, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendEmailVerificationOTP = async (to, token) => {
  const subject = "Email Verification Code";
  const text = `Dear user,
  You requested for a verification code
  ${token}
  Copy to your activation code or ignore if this wasn't you.`;
  await sendEmail(to, subject, text);
};

const sendTeamInvitationEmail = async (to, team, invitationId) => {
  const subject = "Team invitation";
  const teamInvitationUrl = `${config.clientURL}/app/team-invitation/${team.id}?invitationId=${invitationId}`;
  const text = `Dear user,
  To join the team ${team.name}, click on this link: ${teamInvitationUrl}
  If you do not wish to join, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendClientReservationEmail = async (to, user, reservationId) => {
  const subject = "Reservation Breakdown";
  const reservationUrl = `${config.clientURL}/app/reservation/reservationId=${reservationId}`;
  const text = `Hello ${user ? user : "there"},
  Thank you for booking an appointment with Ronky Salon, click on this link to view your active appointment: ${reservationUrl}. 
  A reminder would be sent few hours to set date.
  If you have not booked an appointment, then ignore this email.`;

  await sendEmail(to, subject, text);
};

const sendAdminReservationEmail = async (user, service, reservationId) => {
  const subject = "Reservation Breakdown";
  to = config.email.from;
  const reservationUrl = `${config.clientURL}/app/reservation/reservationId=${reservationId}`;
  const text = `Hello Mrs Ronky,
  There is a new booking for an appointment with ${user} for ${service} services, click on this link to view your active appointment: ${reservationUrl}. 
  A reminder would be sent few hours to set date.
  If you have not booked an appointment, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendReminderEmail = async (to, user, reservationId) => {
  const subject = "Reservation Reminder";
  const reservationUrl = `${config.clientURL}/app/reservation/reservationId=${reservationId}`;
  const text = `Hello ${user ? user : "there"},
  Thank you for booking an appointment with Ronky Salon, This is a reminder for your appointment. Click on this link to view your active appointment: ${reservationUrl}.
  If you have not booked an appointment, then ignore this email.`;
  await sendEmail(to, subject, text);
};

module.exports = {
  // transport,
  sendEmail,
  sendResetPasswordEmail,
  sendEmailVerificationEmail,
  sendTeamInvitationEmail,
  sendClientReservationEmail,
  sendAdminReservationEmail,
  sendReminderEmail,
  sendEmailVerificationOTP,
};
