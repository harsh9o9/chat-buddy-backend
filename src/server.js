import { Server } from 'socket.io';
import chatRouter from './routes/chat-app/chat.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { corsOptions } from './constants.js';
import { createServer } from 'http';
import errorHandler from './middlewares/error.middlewares.js';
import express from 'express';
import { initializeSocketIO } from './socket/index.js';
import messageRouter from './routes/chat-app/message.routes.js';
import morgan from 'morgan';
import userRouter from './routes/user.routes.js';

/* 
  1. INITIALIZE EXPRESS APPLICATION 🏁
*/
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: corsOptions
});

/* 
  2. APPLICATION MIDDLEWARES AND CUSTOMIZATIONS 🪛
*/
app.set('io', io); // making io object available globally
app.disable('x-powered-by'); // Disable X-Powered-By header in responses

app.use(cors(corsOptions)); // Enable Cross Origin Resource Sharing
app.options('*', cors(corsOptions));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

/* 
  3. APPLICATION ROUTES 🛣️
*/
app.use('/api/users', userRouter);
app.use('/api/chat-app/chats', chatRouter);
app.use('/api/chat-app/messages', messageRouter);
initializeSocketIO(io);

/* 
4. APPLICATION ERROR HANDLING 🚔
*/
// Handle unregistered route for all HTTP Methods
app.all('*', function (req, res, next) {
    // Forward to next closest middleware
    next();
});
app.use(errorHandler);

export default httpServer;
