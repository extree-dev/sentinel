import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Роуты
import verificationRouter from './routes/verification.js';
import discordRouter from './routes/discord.js';
import guildRouter from './routes/guild.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Подключение роутов
app.use('/api/verification', verificationRouter);
app.use('/api/discord', discordRouter);
app.use('/api/guild', guildRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});