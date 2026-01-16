const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const screenshotService = require('../services/screenshot.service');
const logger = require('../utils/logger');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/screenshots';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const employeeId = req.user.id;
        const timestamp = Date.now();
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${employeeId}_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG/JPG/PNG images are allowed'));
    }
}).single('screenshot');

/**
 * Handle screenshot upload
 */
exports.uploadScreenshot = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            logger.error('Multer error:', err);
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        try {
            const employeeId = req.user.id;
            // Parse ISO string to MySQL format (YYYY-MM-DD HH:MM:SS)
            const isoTime = req.body.timestamp || new Date().toISOString();
            const dateObj = new Date(isoTime);
            const screenshotTime = dateObj.toISOString().slice(0, 19).replace('T', ' ');

            const filePath = req.file.path.replace(/\\/g, '/');
            const fileSizeKb = Math.round(req.file.size / 1024);

            const metadata = {
                id: uuidv4(),
                employeeId,
                screenshotTime,
                filePath,
                fileSizeKb
            };

            const saved = await screenshotService.saveScreenshotMetadata(metadata);

            if (saved) {
                res.json({
                    success: true,
                    message: 'Screenshot uploaded and indexed',
                    data: { id: metadata.id }
                });
            } else {
                // Cleanup file if DB save fails
                fs.unlinkSync(req.file.path);
                res.status(500).json({ success: false, message: 'Failed to index screenshot' });
            }
        } catch (error) {
            logger.error('Screenshot upload error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
};

/**
 * Get screenshots for admin (filtered by employee/date)
 */
exports.getScreenshots = async (req, res) => {
    try {
        const { employeeId, date, limit = 50, offset = 0 } = req.query;
        const db = require('../config/database');

        let query = 'SELECT * FROM screenshots';
        const params = [];

        if (employeeId || date) {
            query += ' WHERE';
            if (employeeId) {
                query += ' employee_id = ?';
                params.push(employeeId);
            }
            if (date) {
                if (employeeId) query += ' AND';
                query += ' DATE(screenshot_time) = ?';
                params.push(date);
            }
        }

        query += ' ORDER BY screenshot_time DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const screenshots = await db.query(query, params);

        res.json({
            success: true,
            data: screenshots
        });
    } catch (error) {
        logger.error('Get screenshots error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch screenshots' });
    }
};

/**
 * Delete a screenshot
 */
exports.deleteScreenshot = async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../config/database');

        // Get screenshot to find file path
        const [screenshot] = await db.query('SELECT file_path FROM screenshots WHERE id = ?', [id]);

        if (!screenshot) {
            return res.status(404).json({ success: false, message: 'Screenshot not found' });
        }

        // Delete from DB first
        await db.query('DELETE FROM screenshots WHERE id = ?', [id]);

        // Try to delete file
        const fullPath = path.resolve(screenshot.file_path);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
                console.log(`Deleted screenshot file: ${fullPath}`);
            } catch (fsError) {
                console.error('Failed to delete screenshot file:', fsError);
                // We don't fail the request if file delete fails, as DB record is gone
            }
        }

        res.json({ success: true, message: 'Screenshot deleted successfully' });
    } catch (error) {
        logger.error('Delete screenshot error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete screenshot' });
    }
};
