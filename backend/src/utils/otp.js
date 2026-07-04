// Generate random OTP
const generateOTP = () => {
  const length = parseInt(process.env.OTP_LENGTH || 6);
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

// Mock SMS send (replace with actual SMS provider in production)
const sendOTP = async (phone, otp) => {
  // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`[MOCK SMS] Sending OTP ${otp} to ${phone}`);
  return true;
};

// Validate phone number (Indian format)
const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

// Format phone number
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return `+91${cleaned}`;
};

module.exports = {
  generateOTP,
  sendOTP,
  isValidPhone,
  formatPhone
};
