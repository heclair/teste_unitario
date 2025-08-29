import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", router);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Rota não encontrada" });
});

app.use(errorHandler);

export default app;
