// routes/userRoutes.js
import express from 'express';
import { body, param } from 'express-validator';
import { register, login, getMe, getUserById } from '../controllers/userController.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

const registerValidation = [
    body('firstName').trim().notEmpty().withMessage('Имя обязательно'),
    body('lastName').trim().notEmpty().withMessage('Фамилия обязательна'),
    body('email').isEmail().withMessage('Неверный формат email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль не менее 6 символов'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Роль должна быть user или admin'),
];
const loginValidation = [
    body('email').isEmail().withMessage('Неверный формат email'),
    body('password').exists().withMessage('Пароль обязателен'),
];
const idValidation = [param('userId').isMongoId().withMessage('Неверный формат ID')];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authMiddleware, getMe);
router.get('/:userId', idValidation, getUserById);

export default router;