// utils/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    try {
        // Ожидаем в заголовке Authorization: Bearer <token>
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Нет токена, доступ запрещён' });
        }
        const token = authHeader.replace(/^Bearer\s?/, '');

        const decoded = jwt.verify(token, 'secret123');
        // Добавляем данные пользователя в запрос
        req.userId = decoded._id;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({ message: 'Неверный или истёкший токен' });
    }
};
