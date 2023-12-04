import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
/**
 * @description This middleware is responsible to catch the errors from any request handler wrapped inside the {@link asyncHandler}
 */

const errorHandler = (err, req, res, next) => {
  let error = err;

  console.log("in errorhandler");

  /**
   * if error is not instance of {@link ApiError} then create a instance to maitain consistency
   */
  if (!error instanceof ApiError) {
    // if error related to mongoose then 400 (Bad Request) else 500 (Server Error)
    const statusCode = error instanceof mongoose.Error ? 400 : 500;

    const message = error?.message || "something went wrong";
    error = new ApiError(
      statusCode,
      message,
      error?.errors || [],
      error?.stack
    );
  }
  // creating response to send to user in case of error
  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
