const axios = require("axios");

async function sendAttendance(data) {
  try {
    await axios.post("http://localhost:5000/api/attendance/submit", data);
    console.log("Attendance sent successfully");
  } catch (error) {
    console.error("Error sending attendance", error.message);
  }
}

module.exports = { sendAttendance };
