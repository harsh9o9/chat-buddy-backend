import chatRouter from "./routes/chat-app/chat.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middlewares.js";
import express from "express";
import messageRouter from "./routes/chat-app/message.routes.js";
import morgan from "morgan";
import userRouter from "./routes/user.routes.js";
import { config } from "./constants.js";
import { createServer } from "http";
import { initializeSocketIO } from "./socket/index.js";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: [config.CORS_URL],
    credentials: true,
  },
});

// making it available globally
app.set("io", io);

app.use(
  cors({
    origin: [config.CORS_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/chat-app/chats", chatRouter);
app.use("/api/chat-app/messages", messageRouter);

initializeSocketIO(io);
app.use(errorHandler);

export default httpServer;
