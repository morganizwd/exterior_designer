// controllers/assetController.js
import Asset from '../models/Asset.js';
import { validationResult } from 'express-validator';

export const createAsset = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { shop, name, url, category, color, price, width, height } = req.body;
    try {
        const asset = new Asset({ shop, name, url, category, color, price, width, height });
        await asset.save();
        res.status(201).json(asset);
    } catch (err) {
        console.error('createAsset error:', err);
        res.status(500).json({ message: 'Ошибка сервера при создании ассета' });
    }
};

export const getAssets = async (req, res) => {
    try {
        const assets = await Asset.find().populate('shop', 'name');
        res.json(assets);
    } catch (err) {
        console.error('getAssets error:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении ассетов' });
    }
};

export const getAssetById = async (req, res) => {
    const { id } = req.params;
    try {
        const assets = await Asset.find().populate('shop', 'name address info');
        if (!asset) {
            return res.status(404).json({ message: 'Ассет не найден' });
        }
        res.json(asset);
    } catch (err) {
        console.error('getAssetById error:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении ассета' });
    }
};

export const updateAsset = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { shop, name, url, category, color, price, width, height } = req.body;
    try {
        const asset = await Asset.findById(id);
        if (!asset) {
            return res.status(404).json({ message: 'Ассет не найден' });
        }
        Object.assign(asset, { shop, name, url, category, color, price, width, height });
        await asset.save();
        res.json(asset);
    } catch (err) {
        console.error('updateAsset error:', err);
        res.status(500).json({ message: 'Ошибка сервера при обновлении ассета' });
    }
};

export const deleteAsset = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Asset.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Ассет не найден' });
        }
        res.json({ message: 'Ассет успешно удалён' });
    } catch (err) {
        console.error('deleteAsset error:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении ассета' });
    }
};