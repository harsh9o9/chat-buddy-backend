import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat-app/chat.routes.js";
import messageRouter from "./routes/chat-app/message.routes.js";
import errorHandler from "./middlewares/error.middlewares.js";
import { initializeSocketIO } from "./socket/index.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

// making it available globally
app.set("io", io);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/chat-app/chats", chatRouter);
app.use("/api/chat-app/messages", messageRouter);

initializeSocketIO(io);
app.use(errorHandler);

export default httpServer;
