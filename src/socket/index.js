import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
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
      const cookies = cookie.parse(socket.handshake.headers?.cookie || ""); // needs withCredentails: true

      let token = cookies?.accessToken;

      if (!token) {
        // if not token in cookies then check in auth handshake
        token = socket.handshake?.auth || "";
      }

      if (!token) {
        throw new ApiError(401, "Un-authorized handshake. Token is missing");
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decodedToken?._id).select("-password");

      if (!user) {
        throw new ApiError(401, "Un-authorized handshake. Token is invalid");
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
      console.log("in initializeSocketIO error");
      socket.emit(
        ChatEvents.SOCKET_ERROR_EVENT,
        err?.message || "Something went wrong while connecting to the socket."
      );
    }
  });
};

/**
 *
 * @param req - Request object to access the `io` instance set at the entry point
 * @param {string} roomId - Room where the event should be emitted
 * @param {ChatEvents} event - Event that should be emitted
 * @param {any} payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */
const emitSocketEvent = (req, roomId, event, payload) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };
