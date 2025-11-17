import dotenv from "dotenv";
import cors from "cors";
import type { Application } from "express";
import express from "express";
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from "./config/db.js";
import { ensureQuizzesExist } from './utils/seedQuizzes.js';
import UserRouter from "./routes/userRoutes.js";
import QuestionRouter from "./routes/questionRoute.js";
import QuizRouter from "./routes/quizRoute.js";
import AuthRouter from "./routes/authRoutes.js";
import UploadRouter from "./routes/uploadRoutes.js";
import AttemptRouter from "./routes/attemptRoutes.js";
import LeaderboardRouter from "./routes/leaderboardRoutes.js";

dotenv.config();

const app: Application = express();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

//CORS
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000' , 'https://rextro-shcool-quiz-platform.vercel.app','https://mathquest.rextro.lk', 'https://rextro-shcool-quiz-platform-mk9quv3jh.vercel.app'], // Allow both frontend ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Middleware - Increase limit for image uploads (base64 images can be large)
app.use(express.json({ limit: '10mb' })); // Allow up to 10MB for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect to MongoDB

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Rextro Quiz API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true
  }
}));

// API documentation JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerDocument);
});

// Routes
app.get("/", (req, res) => {
  res.send(`
    <h1>🚀 Rextro Quiz Platform API</h1>
    <p>API is running successfully!</p>
    <p><a href="/api-docs" target="_blank">📚 View API Documentation</a></p>
    <p><a href="/api-docs.json" target="_blank">📄 Download OpenAPI JSON</a></p>
  `);
});

// API Routes
app.use("/api/users", UserRouter);
app.use("/api/questions", QuestionRouter);
app.use("/api/quizzes", QuizRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/upload", UploadRouter);
app.use("/api/attempts", AttemptRouter);
app.use("/api/leaderboard", LeaderboardRouter);

const start = async () => {
  await connectDB();
  // Ensure required quiz documents exist (idempotent)
  try {
    await ensureQuizzesExist();
  } catch (err) {
    console.error('Error ensuring quizzes at startup:', err);
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/api-docs.json`);
  });
};

start();

// handling unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error(`❌ Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
