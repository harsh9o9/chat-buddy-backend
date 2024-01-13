import cookie from "cookie";
import jwt from "jsonwebtoken";
import { CustomError } from "../utils/CustomError.js";
import { User } from "../models/user.models.js";
import { ChatEvents } from "../constants.js";

// This function is responsible to allow user to join the chat represented by chatId (chatId). event happens when user switches between the chats
const mountJoinChatEvent = (socket) => {
  socket.on(ChatEvents.JOIN_CHAT_EVENT, (chatId) => {
    console.log(`User 🤖 joined the chat 💬. chatId: `, chatId);
    // joining the room with the chatId will allow specific events to be fired where we don't bother about the users events like typing events
    // E.g. When user types we don't want to emit that event to specific participant.
    // We want to just emit that to the chat where the typing is happening
    socket.join(chatId);
  });
};

// This function is responsible to emit the typing event to the participants of the chat
// const mountParticipantTypingEvent = (socket) => {
//   socket.on(ChatEvents.TYPING_EVENT, (chatId) => {
//     console.log("in B Typing");
//     socket.in(chatId).emit(ChatEvents.TYPING_EVENT, chatId);
//   });
// };

// This function is responsible to emit the stopped typing event to the participants of the chat
// const mountParticipantStoppedTypingEvent = (socket) => {
//   socket.on(ChatEvents.STOP_TYPING_EVENT, (chatId) => {
//     console.log("in B stopTyping");
//     socket.emit(ChatEvents.STOP_TYPING_EVENT, chatId);
//   });
// };

const initializeSocketIO = (io) => {
  io.on("connection", async (socket) => {
    try {
      let token = socket.handshake.auth?.token || ""; // needs withCredentails: true
      token = token.split(" ")[1];
      // let token = cookies?.accessToken;
      // console.log("parsed: ", cookie.parse(token));

      if (!token) {
        console.log("one1");
        // if not token in cookies then check in auth handshake
        token = socket.handshake?.auth || "";
      }
      console.log(token);
      if (!token) {
        console.log("two2");
        throw new CustomError("Un-authorized handshake. Token is missing", 401);
      }
      console.log("decodedToken1: ", process.env.AUTH_ACCESS_TOKEN_SECRET);
      const decodedToken = jwt.verify(
        token,
        process.env.AUTH_ACCESS_TOKEN_SECRET
      );
      console.log("decodedToken: ", decodedToken);
      const user = await User.findById(decodedToken?._id).select("-password");

      if (!user) {
        throw new CustomError("Un-authorized handshake. Token is invalid", 401);
      }

      socket.user = user; // mount te user object to the socket

      // joining user to a room on login with his id, so an event can be emmited to this particular user when
      socket.join(user._id.toString());
      socket.emit(ChatEvents.CONNECTED_EVENT);
      console.log("User connected ✅: ", user._id.toString());

      // events to fire
      mountJoinChatEvent(socket);
      // mountParticipantTypingEvent(socket);
      // mountParticipantStoppedTypingEvent(socket);

      socket.on(ChatEvents.DISCONNECT_EVENT, () => {
        console.log("user has disconnected 🚫: " + socket.user?._id);
        if (socket.user?._id) {
          socket.leave(socket.user._id);
        }
      });
    } catch (err) {
      console.log("in initializeSocketIO error: ", err);
      socket.emit(
        ChatEvents.SOCKET_ERROR_EVENT,
        err?.message || "Something went wrong while connecting to the socket."
      );
    }
  });
};

/**
 * emits a socket event for everyone in room
 * @param req - Request object to access the `io` instance set at the entry point
 * @param {string} roomId - Room where the event should be emitted
 * @param {ChatEvents} event - Event that should be emitted
 * @param {any} payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */
const emitSocketEventToAll = (req, roomId, event, payload = {}) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

/**
 * emits a socket event for everyone except sending user in room
 * @param req - Request object to access the `io` instance set at the entry point
 * @param {string} roomId - Room where the event should be emitted
 * @param {ChatEvents} event - Event that should be emitted
 * @param {any} payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */

const emitSocketEventExceptUser = (req, roomId, event, payload = {}) => {
  req.app.get("io").to(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEventToAll, emitSocketEventExceptUser };
