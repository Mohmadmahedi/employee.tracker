const express = require("express");
const attendanceRoutes = require("./routes/attendance");

const app = express();
app.use(express.json());

app.use("/api/attendance", attendanceRoutes);

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
