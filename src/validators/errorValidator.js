import { validationResult } from "express-validator";
import { CustomError } from "../utils/CustomError.js";

const errorValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // const extractedErrors = [];
  // errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));
  console.log("errors:", errors);
  // 422: Unprocessable Entity
  console.log("in error validator");
  next(new CustomError(errors.array(), 500, errors.array()[0]?.msg));
};

export default errorValidator;
