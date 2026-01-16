const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

// Configure storage for recordings
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/recordings';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const employeeId = req.body.employeeId || 'unknown';
        const timestamp = Date.now();
        const ext = '.webm';
        cb(null, `${employeeId}_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
}).single('recording');

/**
 * Handle recording upload
 */
exports.uploadRecording = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer recording error:', err);
            logger.error('Multer recording error:', err);
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            console.error('No recording file found in request');
            return res.status(400).json({ success: false, message: 'No recording file uploaded' });
        }

        console.log('Recording upload received:', {
            file: req.file.originalname,
            size: req.file.size,
            body: req.body
        });

        try {
            const { employeeId, duration } = req.body;

            if (!employeeId) {
                console.error('Missing employeeId in recording upload');
                return res.status(400).json({ success: false, message: 'Missing employeeId' });
            }

            const now = new Date();
            const recordingTime = now.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS
            const filePath = req.file.path.replace(/\\/g, '/');
            const fileSizeKb = Math.round(req.file.size / 1024);

            await db.query(
                `INSERT INTO recordings (id, employee_id, recording_time, file_path, file_size_kb, duration_sec)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), employeeId, recordingTime, filePath, fileSizeKb, parseInt(duration || 0)]
            );

            console.log('Recording successfully saved to database');

            res.json({
                success: true,
                message: 'Recording saved successfully'
            });
        } catch (error) {
            console.error('CRITICAL Recording upload error:', error);
            logger.error('Recording upload error:', error);
            // Cleanup file if DB save fails
            if (req.file) fs.unlinkSync(req.file.path);
            res.status(500).json({
                success: false,
                message: 'Internal server error during recording save',
                error: error.message
            });
        }
    });
};

/**
 * Get recordings for admin
 */
exports.getRecordings = async (req, res) => {
    try {
        const { employeeId, date, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT r.*, e.full_name, e.email 
            FROM recordings r
            JOIN employees e ON r.employee_id = e.id
        `;
        const params = [];

        if (employeeId || date) {
            query += ' WHERE';
            if (employeeId) {
                query += ' r.employee_id = ?';
                params.push(employeeId);
            }
            if (date) {
                if (employeeId) query += ' AND';
                query += ' DATE(r.recording_time) = ?';
                params.push(date);
            }
        }

        query += ' ORDER BY r.recording_time DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const recordings = await db.query(query, params);

        res.json({
            success: true,
            data: recordings
        });
    } catch (error) {
        logger.error('Get recordings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recordings' });
    }
};

/**
 * Delete a recording
 */
exports.deleteRecording = async (req, res) => {
    try {
        const { id } = req.params;

        // Get recording to find file path
        const [recording] = await db.query('SELECT file_path FROM recordings WHERE id = ?', [id]);

        if (!recording) {
            return res.status(404).json({ success: false, message: 'Recording not found' });
        }

        // Delete from DB first
        await db.query('DELETE FROM recordings WHERE id = ?', [id]);

        // Try to delete file
        const fullPath = path.resolve(recording.file_path);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
                console.log(`Deleted recording file: ${fullPath}`);
            } catch (fsError) {
                console.error('Failed to delete recording file:', fsError);
                // We don't fail the request if file delete fails, as DB record is gone
            }
        }

        res.json({ success: true, message: 'Recording deleted successfully' });
    } catch (error) {
        logger.error('Delete recording error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete recording' });
    }
};
