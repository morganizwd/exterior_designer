import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import userRoutes from './routes/userRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import uploadRoutes from './routes/fileUploadRoutes.js';

import path from 'path';

// Подключаемся к MongoDB
mongoose
    .connect('mongodb://admin:He12345678@ac-hz3edyi-shard-00-00.vgtv5yo.mongodb.net:27017,ac-hz3edyi-shard-00-01.vgtv5yo.mongodb.net:27017,ac-hz3edyi-shard-00-02.vgtv5yo.mongodb.net:27017/landscape?ssl=true&replicaSet=atlas-124m2q-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('DB OK'))
    .catch((err) => console.log('DB ERROR', err));

const app = express();
app.use(express.json());
app.use(cors());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Роуты
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(5000, () => console.log('Server started on port 5000'));