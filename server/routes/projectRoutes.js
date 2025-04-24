// routes/projectRoutes.js
import express from 'express';
import { body, param } from 'express-validator';
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} from '../controllers/projectController.js';

const router = express.Router();

const plotValidation = [
    body('plot.type').isIn(['Rectangle', 'Polygon']).withMessage('Неверный тип участка'),
    body('plot.width').optional().isNumeric().withMessage('Ширина участка должна быть числом'),
    body('plot.height').optional().isNumeric().withMessage('Высота участка должна быть числом'),
    body('plot.points').optional().isArray().withMessage('Точки должны быть массивом'),
];

const objectsValidation = [
    body('objects').isArray().withMessage('Objects должен быть массивом'),
    body('objects.*.asset').isMongoId().withMessage('Неверный ID ассета'),
    body('objects.*.x').isNumeric().withMessage('Координата X должна быть числом'),
    body('objects.*.y').isNumeric().withMessage('Координата Y должна быть числом'),
    body('objects.*.scale').optional().isNumeric().withMessage('Scale должен быть числом'),
    body('objects.*.rotation').optional().isNumeric().withMessage('Rotation должен быть числом'),
];

const projectValidation = [
    body('user').isMongoId().withMessage('Неверный ID пользователя'),
    body('name').optional().isString(),
    body('description').optional().isString(),
    ...plotValidation,
    ...objectsValidation,
];

const idValidation = [
    param('id').isMongoId().withMessage('Неверный формат ID'),
];

router.post('/', projectValidation, createProject);
router.get('/', getProjects);
router.get('/:id', idValidation, getProjectById);
router.put('/:id', [...idValidation, ...projectValidation], updateProject);
router.delete('/:id', idValidation, deleteProject);

export default router;