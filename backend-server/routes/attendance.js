const express = require("express");
const { writeToSheet } = require("../services/googleSheet");

const router = express.Router();

router.post("/submit", async (req, res) => {
  try {
    console.log("Attendance received:", req.body);
    

    await writeToSheet(req.body);

    // VERY IMPORTANT: always send response
    res.status(200).json({ success: true, message: "Attendance saved" });
  } catch (error) {
    console.error("Error saving attendance:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save attendance"
    });
  }
});

module.exports = router;
