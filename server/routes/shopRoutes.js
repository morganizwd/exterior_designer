// routes/shopRoutes.js
import express from 'express';
import { body, param } from 'express-validator';
import {
    createShop,
    getShops,
    getShopById,
    updateShop,
    deleteShop
} from '../controllers/shopController.js';

const router = express.Router();

// Валидация
const shopValidation = [
    body('name').trim().notEmpty().withMessage('Название магазина обязательно'),
    body('address').optional().isString().withMessage('Адрес должен быть строкой'),
    body('info').optional().isString().withMessage('Информация должна быть строкой'),
];

const idValidation = [
    param('id').isMongoId().withMessage('Неверный формат ID'),
];

// Маршруты
router.post('/', shopValidation, createShop);
router.get('/', getShops);
router.get('/:id', idValidation, getShopById);
router.put('/:id', [...idValidation, ...shopValidation], updateShop);
router.delete('/:id', idValidation, deleteShop);

export default router;