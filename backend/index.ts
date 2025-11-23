import dotenv from "dotenv";
import cors from "cors";
import type { Application } from "express";
import express from "express";
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import connectDB from "./config/db.js";
import UserRouter from "./routes/userRoutes.js";
import QuestionRouter from "./routes/questionRoute.js";
import QuizRouter from "./routes/quizRoute.js";
import AuthRouter from "./routes/authRoutes.js";
import UploadRouter from "./routes/uploadRoutes.js";
import AttemptRouter from "./routes/attemptRoutes.js";
import LeaderboardRouter from "./routes/leaderboardRoutes.js";

dotenv.config();

const app: Application = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000' , 'https://rextro-shcool-quiz-platform.vercel.app','https://mathquest.rextro.lk', 'https://rextro-shcool-quiz-platform-mk9quv3jh.vercel.app'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))


app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());




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


app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerDocument);
});


app.get("/", (req, res) => {
  res.send(`
    <h1>🚀 Rextro Quiz Platform API</h1>
    <p>API is running successfully!</p>
    <p><a href="/api-docs" target="_blank">📚 View API Documentation</a></p>
    <p><a href="/api-docs.json" target="_blank">📄 Download OpenAPI JSON</a></p>
  `);
});


app.use("/api/users", UserRouter);
app.use("/api/questions", QuestionRouter);
app.use("/api/quizzes", QuizRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/upload", UploadRouter);
app.use("/api/attempts", AttemptRouter);
app.use("/api/leaderboard", LeaderboardRouter);

const start = async () => {
  await connectDB();
  

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/api-docs.json`);
  });
};

start();


process.on("unhandledRejection", (err: Error) => {
  console.error(`❌ Error: ${err.message}`);
  
  process.exit(1);
});
