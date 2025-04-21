// controllers/userController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

// Регистрация пользователя
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        // Хешируем пароль
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const doc = new User({
            firstName,
            lastName,
            email,
            passwordHash: hash,
            role,
        });

        const user = await doc.save();

        // Генерируем токен
        const token = jwt.sign(
            { _id: user._id, role: user.role },
            'secret123',
            { expiresIn: '30d' }
        );

        const { passwordHash, ...userData } = user._doc;
        res.status(201).json({ ...userData, token });
    } catch (err) {
        console.error('Register error:', err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Email уже занят' });
        }
        res.status(500).json({ message: 'Не удалось зарегистрироваться' });
    }
};

// Вход пользователя
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const isValidPass = await bcrypt.compare(password, user._doc.passwordHash);
        if (!isValidPass) {
            return res.status(400).json({ message: 'Неверный логин или пароль' });
        }

        const token = jwt.sign(
            { _id: user._id, role: user.role },
            'secret123',
            { expiresIn: '30d' }
        );

        const { passwordHash, ...userData } = user._doc;
        res.json({ ...userData, token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Не удалось авторизоваться' });
    }
};

// Получить свои данные
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.json(user);
    } catch (err) {
        console.error('getMe error:', err);
        res.status(500).json({ message: 'Нет доступа' });
    }
};

// Получить пользователя по ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.json({ _id: user._id });
    } catch (err) {
        console.error('getUserById error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};