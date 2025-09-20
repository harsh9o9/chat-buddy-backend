export const DB_NAME = 'ClusterChatApp';

/**
 * @description set of events that we are using in chat buddy.
 */
export const ChatEvents = Object.freeze({
    // ? once user is ready to go
    CONNECTED_EVENT: 'connected',
    // ? when user gets disconnected
    DISCONNECT_EVENT: 'disconnect',
    // ? when user joins a socket room
    JOIN_CHAT_EVENT: 'joinChat',
    // ? when participant gets removed from group, chat gets deleted or leaves a group
    LEAVE_CHAT_EVENT: 'leaveChat',
    // ? when admin updates a group name
    UPDATE_GROUP_NAME_EVENT: 'updateGroupName',
    // ? when new message is received
    MESSAGE_RECEIVED_EVENT: 'messageReceived',
    // ? when there is new one on one chat, new group chat or user gets added in the group
    NEW_CHAT_EVENT: 'newChat',
    // ? when there is an error in socket
    SOCKET_ERROR_EVENT: 'socketError',
    // ? when participant stops typing
    STOP_TYPING_EVENT: 'stopTyping',
    // ? when participant starts typing
    TYPING_EVENT: 'typing',
    // ? when user does a master logout
    MASTER_LOGOUT: 'masterLogout'
});

// const production = {
//     URL: ['https://chat-buddy-harsh9o9.vercel.app', 'https://www.chatbuddy.online']
// };
// const development = {
//     URL: 'http://localhost:3000'
// };

// export const config =
//   process.env.NODE_ENV === "development" ? development : production;

export const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'https://chat-buddy-harsh9o9.vercel.app',
            'https://www.chatbuddy.online'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    exposedHeaders: ['WWW-Authenticate']
};

export const REFRESH_TOKEN = {
    secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
    cookie: {
        name: 'refreshTkn',
        options: {
            sameSite: 'Lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        }
    }
};

export const ACCESS_TOKEN = {
    secret: process.env.AUTH_ACCESS_TOKEN_SECRET
};
export const RESET_PASSWORD_TOKEN = {
    expiry: process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS
};
