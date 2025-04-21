import express from 'express';
import { body, param } from 'express-validator';
import {
    createAsset,
    getAssets,
    getAssetById,
    updateAsset,
    deleteAsset
} from '../controllers/assetController.js';

const router = express.Router();

// Валидация ассета
const assetValidation = [
    body('shop').isMongoId().withMessage('Неверный ID магазина'),
    body('name').trim().notEmpty().withMessage('Название обязательно'),
    body('url').isString().withMessage('URL должен быть строкой'),
    body('category').trim().notEmpty().withMessage('Категория обязательна'),
    body('color').trim().notEmpty().withMessage('Цвет обязателен'),
    body('price').isNumeric().withMessage('Цена должна быть числом'),
    body('width').optional().isNumeric().withMessage('Width должен быть числом'),
    body('height').optional().isNumeric().withMessage('Height должен быть числом'),
];
const idValidation = [param('id').isMongoId().withMessage('Неверный формат ID')];

// Маршруты
router.post('/', assetValidation, createAsset);
router.get('/', getAssets);
router.get('/:id', idValidation, getAssetById);
router.put('/:id', [...idValidation, ...assetValidation], updateAsset);
router.delete('/:id', idValidation, deleteAsset);

export default router;