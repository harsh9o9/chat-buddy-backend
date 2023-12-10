import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    console.error("Unauthorized request - token issue");
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select("-password");
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user; // adding user data to req itself to use if later
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
