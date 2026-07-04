// Validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return typeof email === 'string' && emailRegex.test(email);
};

const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return typeof phoneNumber === 'string' && phoneRegex.test(phoneNumber);
};

// Validation middleware
const validateEmail = (req, res, next) => {
  const { email } = req.body || {};

  if (email && !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  next();
};

const validatePassword = (req, res, next) => {
  const { password } = req.body || {};

  if (password && !isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  next();
};

const validatePhoneNumber = (req, res, next) => {
  const { phoneNumber } = req.body || {};

  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }
  next();
};

const validateAppointmentDate = (req, res, next) => {
  const { appointmentDate: rawAppointmentDate } = req.body || {};
  const appointmentDate = new Date(rawAppointmentDate);

  if (appointmentDate <= new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Appointment date must be in the future'
    });
  }
  next();
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateAppointmentDate
};
