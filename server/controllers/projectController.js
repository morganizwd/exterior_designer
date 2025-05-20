import Project from '../models/Project.js';
import { validationResult } from 'express-validator';

export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { user, name, description, plot, objects, walls } = req.body;
    try {
        const project = new Project({ user, name, description, plot, objects, walls });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        console.error('createProject error:', err);
        res.status(500).json({ message: 'Ошибка сервера при создании проекта' });
    }
};

export const getProjects = async (_req, res) => {
    try {
        const projects = await Project.find()
            .populate('user', 'firstName lastName')
            .populate('objects.asset');
        res.json(projects);
    } catch {
        res.status(500).json({ message: 'Ошибка сервера при получении проектов' });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('user', 'firstName lastName')
            .populate('objects.asset');
        if (!project) return res.status(404).json({ message: 'Проект не найден' });
        res.json(project);
    } catch {
        res.status(500).json({ message: 'Ошибка сервера при получении проекта' });
    }
};

export const updateProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Проект не найден' });

        const { name, description, plot, objects, walls } = req.body;
        project.set({ name, description, plot, objects, walls });
        await project.save();
        res.json(project);
    } catch {
        res.status(500).json({ message: 'Ошибка сервера при обновлении проекта' });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const result = await Project.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Проект не найден' });
        res.json({ message: 'Проект успешно удалён' });
    } catch {
        res.status(500).json({ message: 'Ошибка сервера при удалении проекта' });
    }
};