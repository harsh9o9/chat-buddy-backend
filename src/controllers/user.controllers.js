import { validationResult } from "express-validator";
import { CustomError } from "../utils/CustomError.js";
import { User } from "../models/user.models.js";

/* 
  1. FETCH USER PROFILE BY ID
*/
export const fetchUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const userId = req.params.id;
    const retrievedUser = await User.findById(userId);

    res.json({
      success: true,
      user: retrievedUser,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/* 
  2. FETCH PROFILE OF AUTHENTICATED USER
*/
export const fetchAuthUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
