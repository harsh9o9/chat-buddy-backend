import {
    fetchAuthUserProfile,
    fetchUserProfile
} from '../controllers/user.controllers.js';
import {
    fetchUserProfileValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    userLoginValidator,
    userRegisterValidator
} from '../validators/user.validators.js';
import {
    forgotPassword,
    loginUser,
    logout,
    logoutAllDevices,
    refreshAccessToken,
    registerUser,
    resetPassword
} from '../controllers/auth.controllers.js';

import { Router } from 'express';
import errorValidator from '../validators/errorValidator.js';
import { requireAuthentication } from '../middlewares/auth.middlewares.js';

const router = Router();

/**
 * @method - POST
 * @param {string} path - /api/users/login
 * @description - User Login
 */
router.route('/login').post(userLoginValidator(), errorValidator, loginUser);

/**
 * @method - POST
 * @param {string} path - /api/users/register
 * @description - User Signup
 */
router
    .route('/register')
    .post(userRegisterValidator(), errorValidator, registerUser);

/**
 * @method - POST
 * @param {string} path - /api/users/logout
 * @description - User Logout
 */
router.route('/logout').post(requireAuthentication, logout);

/**
 * @method - POST
 * @param {string} path - /api/users/master-logout
 * @description - User Logout from all devices
 */
router.route('/master-logout').post(requireAuthentication, logoutAllDevices);

/**
 * @method - POST
 * @param {string} path - /api/users/reauth
 * @description - Refresh Access Token
 */
router.route('/reauth').post(refreshAccessToken);

/**
 * @method - POST
 * @param {string} path - /api/users/forgotpass
 * @description - Send password reset email link
 */
router
    .route('/forgotpass')
    .post(forgotPasswordValidator, errorValidator, forgotPassword);

/**
 * @method - POST
 * @param {string} path - /api/users/resetpass
 * @description - Reset password
 */
router
    .route('/resetpass/:resetToken')
    .post(resetPasswordValidator, errorValidator, resetPassword);

/**
 * @method - GET
 * @param {string} path - /api/users/me
 * @description - Get authenticated user
 */
// router.get("/me", requireAuthentication, fetchAuthUserProfile);

// /**
//  * @method - GET
//  * @param {string} path - /api/users/:id
//  * @description - Get user by ID
//  */
// router.get(
//   "/:id",
//   requireAuthentication,
//   fetchUserProfileValidator,
//   fetchUserProfile
// );

export default router;
