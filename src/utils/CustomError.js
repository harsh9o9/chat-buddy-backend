/**
 * This class extends native Error class to provide more functionality over it
 */
// class ApiError extends Error {
//   constructor(
//     statusCode,
//     message = "Something went wrong",
//     errors = [],
//     stack = ""
//   ) {
//     super(message);
//     this.statusCode = statusCode;
//     this.errors = errors;
//     this.success = false;
//     this.data = null;

//     if (stack) {
//       this.stack = stack;
//     } else {
//       Error.captureStackTrace(this, this.constructor);
//     }
//   }
// }
class CustomError extends Error {
  /**
   * Custom Error Constructor
   * @param {any} [message] - Optional error payload
   * @param {number} [statusCode] - Optional error http status code
   * @param {string} [feedback=""] - Optional feedback message you want to provide
   * @param {string} [stack] - provide stack trace to be send
   */
  constructor(
    message = "Something went wrong",
    statusCode,
    feedback = "",
    stack = ""
  ) {
    super(message);
    this.name = "CustomError";
    this.status = statusCode;
    this.cause = message;
    this.feedback = String(feedback);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { CustomError };
