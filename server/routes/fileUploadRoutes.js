// routes/fileUploadRoutes.js
import express from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';

const router = express.Router();

// Настройка хранилища
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // ваша папка
    },
    filename: (req, file, cb) => {
        // генерируем уникальное имя файла, сохраняя расширение
        const ext = path.extname(file.originalname);
        cb(null, uuid() + ext);
    }
});

// Фильтр по типу файлов (только изображения)
const fileFilter = (req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|gif)$/.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Только изображения разрешены'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Маршрут: POST /api/upload  
// поле формы: 'file'
router.post('/', upload.single('file'), (req, res) => {
    // если всё ок — multer положил файл в uploads/
    // в ответ отдадим путь, по которому фронт сможет к нему обратиться
    res.json({
        url: `/uploads/${req.file.filename}`
    });
});

export default router;