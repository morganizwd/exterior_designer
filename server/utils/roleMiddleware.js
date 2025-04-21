// utils/roleMiddleware.js

export const roleMiddleware = (allowedRoles) => (req, res, next) => {
    try {
        // Проверяем, что authMiddleware уже установил req.userRole
        const userRole = req.userRole;
        if (!userRole) {
            return res.status(401).json({ message: 'Нет роли пользователя. Необходимо авторизоваться.' });
        }
        // Если роль пользователя не входит в список разрешённых
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'У вас нет прав для выполнения этой операции' });
        }
        next();
    } catch (err) {
        console.error('roleMiddleware error:', err);
        res.status(500).json({ message: 'Ошибка при проверке прав доступа' });
    }
};