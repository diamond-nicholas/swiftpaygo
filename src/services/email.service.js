const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../config/logger");

const transport = nodemailer.createTransport(config.email.smtp);

transport
  .verify()
  .then(() => logger.info("Connected to email server"))
  .catch(() =>
    logger.warn(
      "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
    )
  );

const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
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
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendEmailVerificationEmail,
  sendTeamInvitationEmail,
  sendClientReservationEmail,
  sendAdminReservationEmail,
  sendReminderEmail,
  sendEmailVerificationOTP,
};
