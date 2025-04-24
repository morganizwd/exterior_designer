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

import { authMiddleware } from '../utils/authMiddleware.js';
import { roleMiddleware } from '../utils/roleMiddleware.js';

const router = express.Router();

const shopValidation = [
    body('name').trim().notEmpty().withMessage('Название магазина обязательно'),
    body('address').optional().isString().withMessage('Адрес должен быть строкой'),
    body('info').optional().isString().withMessage('Информация должна быть строкой'),
];

const idValidation = [
    param('id').isMongoId().withMessage('Неверный формат ID'),
];

router.post(
    '/',
    authMiddleware,
    roleMiddleware(['admin']),
    shopValidation,
    createShop
);

router.get('/', getShops);

router.get(
    '/:id',
    idValidation,
    getShopById
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    [...idValidation, ...shopValidation],
    updateShop
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    idValidation,
    deleteShop
);

export default router;