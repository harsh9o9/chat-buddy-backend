import { Router } from "express";
import {
  createOrGetAOneOnOneChat,
  getAllChats,
  searchAvailableUsers,
} from "../../controllers/chat-app/chat.controllers.js";
import { verifyJWT } from "../../middlewares/auth.middlewares.js";
import errorValidator from "../../validators/errorValidator.js";
import { mongoIdPathVariableValidator } from "../../validators/common/mongodb.validator.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllChats);
router.route("/users").get(searchAvailableUsers);

router
  .route("/c/:receiverId")
  .post(
    mongoIdPathVariableValidator("receiverId"),
    errorValidator,
    createOrGetAOneOnOneChat
  );

export default router;
