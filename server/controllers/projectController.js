// controllers/projectController.js
import Project from '../models/Project.js';
import { validationResult } from 'express-validator';

// Создание проекта
export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { user, name, description, plot, objects } = req.body;
    try {
        const project = new Project({ user, name, description, plot, objects });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        console.error('createProject error:', err);
        res.status(500).json({ message: 'Ошибка сервера при создании проекта' });
    }
};

// Получить все проекты
export const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('user', 'firstName lastName').populate('objects.asset');
        res.json(projects);
    } catch (err) {
        console.error('getProjects error:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении проектов' });
    }
};

// Получить проект по ID
export const getProjectById = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await Project.findById(id).populate('user', 'firstName lastName').populate('objects.asset');
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }
        res.json(project);
    } catch (err) {
        console.error('getProjectById error:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении проекта' });
    }
};

// Обновить проект
export const updateProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { name, description, plot, objects } = req.body;
    try {
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }
        project.name = name;
        project.description = description;
        project.plot = plot;
        project.objects = objects;
        await project.save();
        res.json(project);
    } catch (err) {
        console.error('updateProject error:', err);
        res.status(500).json({ message: 'Ошибка сервера при обновлении проекта' });
    }
};

// Удалить проект
export const deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Project.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Проект не найден' });
        }
        res.json({ message: 'Проект успешно удалён' });
    } catch (err) {
        console.error('deleteProject error:', err);
        res.status(500).json({ message: 'Ошибка сервера при удалении проекта' });
    }
};