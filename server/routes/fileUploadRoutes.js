// routes/fileUploadRoutes.js
import express from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, uuid() + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|gif)$/.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Только изображения разрешены'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', upload.single('file'), (req, res) => {
    res.json({
        url: `/uploads/${req.file.filename}`
    });
});

export default router;