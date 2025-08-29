import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";
import Redis from "ioredis";

jest.setTimeout(60000);

// Usa .env.test da raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
console.log("[setup] DB:", process.env.DB_NAME, "PG@", process.env.DB_HOST+":"+process.env.DB_PORT, "REDIS@", process.env.REDIS_HOST+":"+process.env.REDIS_PORT);

beforeAll(async () => {
  // Postgres
  global.pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await global.pool.query("SELECT 1");
  console.log("[setup] conectado ao Postgres:", process.env.DB_NAME);

  // Aplica o schema a partir da RAIZ do projeto
  const schemaFile = path.resolve(process.cwd(), "src", "configs", "comandos.sql");
  console.log("[setup] comandos.sql:", schemaFile, "existe?", fs.existsSync(schemaFile));
  if (!fs.existsSync(schemaFile)) {
    throw new Error(`[setup] comandos.sql não encontrado em: ${schemaFile}`);
  }
  const sql = fs.readFileSync(schemaFile, "utf-8");
  await global.pool.query(sql);
  console.log("[setup] schema aplicado com sucesso");

  // Redis
  global.redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
  });
  await global.redis.ping();
  console.log("[setup] conectado ao Redis");

  // silencia erros de lib p/ não poluir testes
  jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(async () => {
  await global.pool.query("TRUNCATE TABLE contacts, users RESTART IDENTITY CASCADE;");
  await global.redis.flushall();
});

afterEach(async () => {
  await global.pool.query("TRUNCATE TABLE contacts, users RESTART IDENTITY CASCADE;");
  await global.redis.flushall();
});

afterAll(async () => {
  if (global.redis) await global.redis.quit();
  if (global.pool) await global.pool.end();
  jest.restoreAllMocks();
});
