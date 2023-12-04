import { body } from "express-validator";

const userLoginValidator = () => {
  return [
    body("username").notEmpty().isString().withMessage("username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be lowercase")
      .isLength({ min: 3 })
      .withMessage("Username must be at lease 3 characters long"),
    body("fullName.firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required"),
    body("fullName.lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ];
};

export { userLoginValidator, userRegisterValidator };
