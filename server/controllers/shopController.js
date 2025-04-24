// controllers/shopController.js
import Shop from '../models/Shop.js';
import { validationResult } from 'express-validator';

export const createShop = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, address, info } = req.body;
    try {
        const shop = new Shop({ name, address, info });
        await shop.save();
        res.status(201).json(shop);
    } catch (err) {
        console.error('createShop error:', err);
        res.status(500).json({ message: 'Ошибка сервера при создании магазина' });
    }
};

export const getShops = async (req, res) => {
    try {
        const shops = await Shop.find();
        res.json(shops);
    } catch (err) {
        console.error('getShops error:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении списка магазинов' });
    }
};

export const getShopById = async (req, res) => {
    const { id } = req.params;
    try {
        const shop = await Shop.findById(id);
        if (!shop) {
            return res.status(404).json({ message: 'Магазин не найден' });
        }
        res.json(shop);
    } catch (err) {
        console.error('getShopById error:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении магазина' });
    }
};

export const updateShop = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { name, address, info } = req.body;
    try {
        const shop = await Shop.findById(id);
        if (!shop) {
            return res.status(404).json({ message: 'Магазин не найден' });
        }
        shop.name = name;
        shop.address = address;
        shop.info = info;
        await shop.save();
        res.json(shop);
    } catch (err) {
        console.error('updateShop error:', err);
        res.status(500).json({ message: 'Ошибка сервера при обновлении магазина' });
    }
};

export const deleteShop = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Shop.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Магазин не найден' });
        }
        res.json({ message: 'Магазин успешно удалён' });
    } catch (err) {
        console.error('deleteShop error:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении магазина' });
    }
};