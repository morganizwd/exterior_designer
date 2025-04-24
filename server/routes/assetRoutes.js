// routes/assetRoutes.js
import express from 'express';
import { body, param } from 'express-validator';
import {
    createAsset,
    getAssets,
    getAssetById,
    updateAsset,
    deleteAsset
} from '../controllers/assetController.js';
import { authMiddleware } from '../utils/authMiddleware.js';
import { roleMiddleware } from '../utils/roleMiddleware.js';

const router = express.Router();

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

router.post(
    '/',
    authMiddleware,
    roleMiddleware(['admin']),
    assetValidation,
    createAsset
);

router.get('/', getAssets);
router.get('/:id', idValidation, getAssetById);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    [...idValidation, ...assetValidation],
    updateAsset
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    idValidation,
    deleteAsset
);

export default router;