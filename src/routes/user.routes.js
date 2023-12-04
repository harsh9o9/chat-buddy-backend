import { Router } from "express";
import {
  userLoginValidator,
  userRegisterValidator,
} from "../validators/user.validators.js";
import errorValidator from "../validators/errorValidator.js";
import { loginUser, registerUser } from "../controllers/user.controllers.js";

const router = Router();

router.route("/login").post(userLoginValidator(), errorValidator, loginUser);
router
  .route("/register")
  .post(userRegisterValidator(), errorValidator, registerUser);

export default router;
