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
    body('plot.width').optional().isNumeric(),
    body('plot.height').optional().isNumeric(),
    body('plot.points').optional().isArray()
];

const objectsValidation = [
    body('objects').isArray(),
    body('objects.*.asset').isMongoId(),
    body('objects.*.x').isNumeric(),
    body('objects.*.y').isNumeric(),
    body('objects.*.scale').optional().isNumeric(),
    body('objects.*.rotation').optional().isNumeric()
];

const wallsValidation = [
    body('walls').optional().isArray(),
    body('walls.*.x').isNumeric(),
    body('walls.*.y').isNumeric(),
    body('walls.*.length').isNumeric(),
    body('walls.*.rotation').isNumeric()
];

const projectValidation = [
    body('user').isMongoId(),
    body('name').optional().isString(),
    body('description').optional().isString(),
    ...plotValidation,
    ...objectsValidation,
    ...wallsValidation
];

const idValidation = [param('id').isMongoId()];

router.post('/', projectValidation, createProject);
router.get('/', getProjects);
router.get('/:id', idValidation, getProjectById);
router.put('/:id', [...idValidation, ...projectValidation], updateProject);
router.delete('/:id', idValidation, deleteProject);

export default router;
