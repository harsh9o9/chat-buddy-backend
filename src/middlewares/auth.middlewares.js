import AuthorizationError from "../utils/AuthorizationError.js";
import { CustomError } from "../utils/CustomError.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Pull in Environment variables
const ACCESS_TOKEN = {
  secret: process.env.AUTH_ACCESS_TOKEN_SECRET,
};

// export const verifyJWT = asyncHandler(async (req, res, next) => {
//   const token =
//     req.cookies?.accessToken ||
//     req.header("Authorization")?.replace("Bearer ", "");

//   if (!token) {
//     console.error("Unauthorized request - token issue");
//     throw new CustomError("Unauthorized request", 401);
//   }

//   try {
//     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     const user = await User.findById(decodedToken?._id).select("-password");
//     if (!user) {
//       throw new CustomError("Invalid access token", 401);
//     }
//     req.user = user; // adding user data to req itself to use if later
//     next();
//   } catch (error) {
//     throw new CustomError(error?.message || "Invalid access token", 401);
//   }
// });

// const AuthorizationError = require("../config/errors/AuthorizationError.js");

export const requireAuthentication = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      throw new AuthorizationError(
        "Authentication Error",
        undefined,
        "You are unauthenticated!",
        {
          error: "invalid_access_token",
          error_description: "unknown authentication scheme",
        }
      );

    const accessTokenParts = authHeader.split(" ");
    const aTkn = accessTokenParts[1];

    const decoded = jwt.verify(aTkn, ACCESS_TOKEN.secret);
    const user = await User.findById(decoded?._id).select("-password");
    if (!user) {
      throw new CustomError("Invalid access token", 401);
    }
    req.user = user; // adding user data to req itself to use if later

    // Attach authenticated user and Access Token to request object
    req.userId = decoded._id;
    req.token = aTkn;
    next();
  } catch (err) {
    // Authentication didn't go well
    console.log("requireAuthentication: ", err);

    const expParams = {
      error: "expired_access_token",
      error_description: "access token is expired",
    };
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
      return next(
        new AuthorizationError(
          "Authentication Error",
          undefined,
          "Token lifetime exceeded!",
          expParams
        )
      );

    next(err);
  }
});
