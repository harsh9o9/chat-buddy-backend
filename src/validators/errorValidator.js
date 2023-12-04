import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

const errorValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

  // 422: Unprocessable Entity
  console.log("in error validator");
  next(new ApiError(422, "Received data is not valid", extractedErrors));
};

export default errorValidator;
