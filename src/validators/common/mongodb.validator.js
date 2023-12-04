import { param } from "express-validator";

/**
 *
 * @param {string} id
 * @description A common validator responsible to validate mongodb ids passed in the url's path variable
 */
export const mongoIdPathVariableValidator = (id) => {
  return [param(id).notEmpty().isMongoId().withMessage(`Invalid ${id}`)];
};
