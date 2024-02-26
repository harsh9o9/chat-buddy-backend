import { body, param } from 'express-validator';

import { User } from '../models/user.models.js';

const userLoginValidator = () => {
    return [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email CANNOT be empty')
            .bail()
            .isEmail()
            .withMessage('Email is invalid'),
        body('password').notEmpty().withMessage('Password is required')
    ];
};

const userRegisterValidator = () => {
    return [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email cannot be empty')
            .bail()
            .isEmail()
            .withMessage('Email is invalid')
            .custom(async (email) => {
                // Finding if email exists in Database
                const emailExists = await User.findOne({ email });
                if (emailExists) {
                    throw new Error('E-mail already in use');
                }
            }),
        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username cannot be empty')
            .bail()
            .isLowercase()
            .withMessage('Username must be lowercase')
            .bail()
            .isLength({ min: 3 })
            .withMessage('Username must be at lease 3 characters long')
            .bail()
            .custom(async (username) => {
                // Finding if email exists in Database
                const usernameExists = await User.findOne({ username });
                if (usernameExists) {
                    throw new Error('username already in use');
                }
            }),
        body('fullName.firstName')
            .trim()
            .notEmpty()
            .withMessage('First name cannot be empty'),
        body('fullName.lastName')
            .trim()
            .notEmpty()
            .withMessage('Last name is required'),
        body('password').trim().notEmpty().withMessage('Password is required')
    ];
};

const forgotPasswordValidator = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email CANNOT be empty')
        .bail()
        .isEmail()
        .withMessage('Email is invalid')
];

const resetPasswordValidator = [
    param('resetToken').notEmpty().withMessage('Reset token missing'),
    body('password')
        .notEmpty()
        .withMessage('Password CANNOT be empty')
        .bail()
        .isLength({ min: 4 })
        .withMessage('Password MUST be at least 4 characters long'),
    body('passwordConfirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords DO NOT match');
        }

        return true;
    })
];

const fetchUserProfileValidator = [
    param('id').notEmpty().withMessage('User id missing')
];
export {
    userLoginValidator,
    userRegisterValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    fetchUserProfileValidator
};
