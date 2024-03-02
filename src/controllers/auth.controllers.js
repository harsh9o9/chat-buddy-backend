import {
    ChatEvents,
    REFRESH_TOKEN,
    RESET_PASSWORD_TOKEN
} from '../constants.js';

import { ApiResponse } from '../utils/ApiResponse.js';
import AuthorizationError from '../utils/AuthorizationError.js';
import { CustomError } from '../utils/CustomError.js';
import { User } from '../models/user.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import crypto from 'crypto';
import { emitSocketEventExceptUser } from '../socket/index.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../services/sendEmail.js';

/*
  1. LOGIN USER
*/
/**
 * Handles the user login request by validating credentials, generating access and refresh tokens, and setting the refresh token cookie.
 *
 * @param {Express.Request} req - The Express request object.
 * @param {Express.Response} res - The Express response object.
 * @returns {Promise<void>} A Promise that resolves when the user is successfully logged in.
 */
const loginUser = asyncHandler(async (req, res) => {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        console.log('Email:', email);
        console.log('Password:', password);
        throw new CustomError('Username and password are required', 400);
    }

    // Identify and retrieve the user by credentials
    const user = await User.findByCredentials(email, password);

    // Generate access and refresh tokens
    const accessToken = await user.generateAcessToken();
    const refreshToken = await user.generateRefreshToken();

    // Set refresh token cookie in the response
    res.cookie(
        REFRESH_TOKEN.cookie.name,
        refreshToken,
        REFRESH_TOKEN.cookie.options
    );

    // Respond with a success message and user details
    res.json(
        new ApiResponse(
            200,
            { user, accessToken }, // Sending access token in response if the client decides to save it
            'User logged in successfully'
        )
    );
});

/*
  2. SIGN UP USER 
*/
/**
 * Handles the user registration request by creating a new user, generating access and refresh tokens, and setting the refresh token cookie.
 *
 * @param {Express.Request} req - The Express request object.
 * @param {Express.Response} res - The Express response object.
 * @returns {Promise<void>} A Promise that resolves when the user is successfully registered.
 */
const registerUser = asyncHandler(async (req, res) => {
    // Extract user information from the request body
    const { username, fullName, email, password } = req.body;

    // Create a new user in the database
    const newUser = await User.create({
        email,
        username,
        fullName,
        password
    });

    // Save the new user to the database
    await newUser.save();

    // Generate access and refresh tokens
    const accessToken = await newUser.generateAcessToken();
    const refreshToken = await newUser.generateRefreshToken();

    console.log('accessToken:', accessToken);
    console.log('refreshToken:', refreshToken);

    // Set refresh token cookie in the response
    res.cookie(
        REFRESH_TOKEN.cookie.name,
        refreshToken,
        REFRESH_TOKEN.cookie.options
    );

    // Check if the user was successfully created
    if (!newUser) {
        throw new CustomError(
            'Something went wrong while registering the user',
            500
        );
    }

    // Respond with a success message and user details
    return res.json(
        new ApiResponse(
            201,
            { user: newUser, accessToken },
            'User registered successfully'
        )
    );
});

/*
  3. LOGOUT USER
*/
/**
 * Handles the logout request by invalidating the current refresh token for the user.
 *
 * @param {Express.Request} req - The Express request object.
 * @param {Express.Response} res - The Express response object.
 * @returns {Promise<void>} A Promise that resolves when the user is logged out.
 */
const logout = asyncHandler(async (req, res) => {
    // Authenticated user ID attached on `req` by authentication middleware
    const userId = req.userId;

    // Find the user by ID
    const user = await User.findById(userId);

    // Extract refresh token from cookies
    const refreshToken = req.cookies[REFRESH_TOKEN.cookie.name];

    //TODO: This check is temp fix, as in incognito mode refresh token cookie is not set causing logout to fail
    if (refreshToken) {
      // Create a refresh token hash
      const rTknHash = crypto
          .createHmac('sha256', REFRESH_TOKEN.secret)
          .update(refreshToken)
          .digest('hex');
  
      // Filter out the current token from the user's tokens
      const filteredTokens = user.tokens.filter(
          (tokenObj) => tokenObj.token !== rTknHash
      );
  
      // Update the user's tokens with the filtered tokens
      user.tokens = filteredTokens;
  
      // Save the updated user information
      await user.save();
      
      // Destroy the refresh token cookie
      res.clearCookie(REFRESH_TOKEN.cookie.name);
    }


    // Respond with success message
    res.status(200).json({
        success: true
    });
});

/*
  4. LOGOUT USER FROM ALL DEVICES
*/
/**
 * Handles the logout from all devices request by invalidating all tokens for the user.
 *
 * @param {Express.Request} req - The Express request object.
 * @param {Express.Response} res - The Express response object.
 * @returns {Promise<void>} A Promise that resolves when the user is logged out from all devices.
 */
const logoutAllDevices = asyncHandler(async (req, res) => {
    // Authenticated user ID attached on `req` by authentication middleware
    const userId = req.userId;

    // Find the user by ID
    const user = await User.findById(userId);

    // Remove all tokens for the user
    user.tokens = undefined;

    // Save the updated user information
    await user.save();

    // Emit socket event to notify other users about the master logout
    emitSocketEventExceptUser(req, userId, ChatEvents.MASTER_LOGOUT);

    // Set cookie expiry to a past date to mark it for destruction
    const expireCookieOptions = {
        ...REFRESH_TOKEN.cookie.options,
        expires: new Date(1)
    };

    // Destroy the refresh token cookie
    res.cookie(REFRESH_TOKEN.cookie.name, '', expireCookieOptions);

    // Respond with success message
    res.status(200).json({
        success: true
    });
});

/*
  5. REGENERATE NEW ACCESS TOKEN
*/

/**
 * Handles the refresh access token request to generate a new access token.
 *
 * @param {Express.Request} req - The Express request object.
 * @param {Express.Response} res - The Express response object.
 * @param {Express.NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>} A Promise that resolves when the new access token is generated and sent.
 */
const refreshAccessToken = async (req, res, next) => {
    try {
        // Extract refresh token from cookies
        const refreshToken = req.cookies[REFRESH_TOKEN.cookie.name];

        // Throw an error if refresh token is missing
        if (!refreshToken) {
            throw new AuthorizationError(
                'Authentication error!',
                undefined,
                'You are unauthenticated',
                {
                    realm: 'reauth',
                    error: 'no_rft',
                    error_description: 'Refresh Token is missing!'
                }
            );
        }

        // Verify and decode the refresh token
        const decodedRefreshTkn = jwt.verify(
            refreshToken,
            REFRESH_TOKEN.secret
        );

        // Hash the refresh token for comparison
        const rTknHash = crypto
            .createHmac('sha256', REFRESH_TOKEN.secret)
            .update(refreshToken)
            .digest('hex');

        // Find the user with the matching refresh token
        const userWithRefreshTkn = await User.findOne({
            _id: decodedRefreshTkn._id,
            'tokens.token': rTknHash
        });

        // Throw an error if no user is found
        if (!userWithRefreshTkn) {
            throw new AuthorizationError(
                'Authentication Error',
                undefined,
                'You are unauthenticated!',
                {
                    realm: 'reauth'
                }
            );
        }

        // Generate a new access token
        const newAtkn = await userWithRefreshTkn.generateAcessToken();

        // Set response headers
        res.status(201);
        res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });

        // Send response with the new access token
        res.json({
            success: true,
            accessToken: newAtkn
        });
    } catch (error) {
        // Handle token-related errors and pass other errors to the next middleware
        if (['JsonWebTokenError', 'TokenExpiredError'].includes(error?.name)) {
            return next(
                new AuthorizationError(
                    error,
                    undefined,
                    'You are unauthenticated',
                    {
                        realm: 'reauth',
                        error_description: 'token error'
                    }
                )
            );
        }
        next(error);
    }
};

/*
  6. FORGOT PASSWORD
*/
const forgotPassword = async (req, res, next) => {
    const MSG = `If ${req.body?.email} is found with us, we've sent an email to it with instructions to reset your password.`;
    try {
        // TODO: make validations before
        const email = req.body.email;

        const user = await User.findOne({ email });
        // If email is not found, we throw an exception BUT with 200 status code
        // because it is a security vulnerability to inform users
        // that the Email is not found.
        // To avoid username enumeration attacks, no extra response data is provided when an email is successfully sent. (The same response is provided when the username is invalid.)
        if (!user) throw new CustomError('Reset link sent', 200, MSG);

        let resetToken = await user.generateResetToken();
        resetToken = encodeURIComponent(resetToken);

        const resetPath = req.header('X-reset-base');
        const origin = req.header('Origin');

        const resetUrl = resetPath
            ? `${resetPath}/${resetToken}`
            : `${origin}/resetpass/${resetToken}`;
        console.log('Password reset URL: %s', resetUrl);

        const emailMessage = `
            <h1>You have requested to change your password</h1>
            <p>You are receiving this because someone(hopefully you) has requested to reset password for your account.<br/>
              Please click on the following link, or paste in your browser to complete the password reset.
            </p>
            <p>
              <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
            </p>
            <p>
              <em>
                If you did not request this, you can safely ignore this email and your password will remain unchanged.
              </em>
            </p>
            <p>
            <strong>DO NOT share this link with anyone else!</strong><br />
              <small>
                <em>
                  This password reset link will <strong>expire after ${
                      RESET_PASSWORD_TOKEN.expiry || 5
                  } minutes.</strong>
                </em>
              <small/>
            </p>
        `;

        try {
            await sendEmail({
                to: user.email,
                html: emailMessage,
                subject: 'Reset password'
            });

            res.json({
                message: 'Reset link sent',
                feedback: MSG,
                success: true
            });
        } catch (error) {
            user.resetpasswordtoken = undefined;
            user.resetpasswordtokenexpiry = undefined;
            await user.save();

            console.log(error.message);
            throw new CustomError('Internal issues standing in the way', 500);
        }
    } catch (err) {
        next(err);
    }
};
/*
  7. RESET PASSWORD
*/

const resetPassword = asyncHandler(async (req, res) => {
    console.log('req.params: ', req.params);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new CustomError(errors.array(), 422);
    }

    const resetToken = new String(req.params.resetToken);

    const [tokenValue, tokenSecret] = decodeURIComponent(resetToken).split('+');

    console.log({ tokenValue, tokenSecret });

    // Recreate the reset Token hash
    const resetTokenHash = crypto
        .createHmac('sha256', tokenSecret)
        .update(tokenValue)
        .digest('hex');

    const user = await User.findOne({
        resetpasswordtoken: resetTokenHash,
        resetpasswordtokenexpiry: { $gt: Date.now() }
    });
    if (!user) throw new CustomError('The reset link is invalid', 400);
    console.log(user);

    user.password = req.body.password;
    user.resetpasswordtoken = undefined;
    user.resetpasswordtokenexpiry = undefined;

    await user.save();

    // Email to notify owner of the account
    const message = `<h3>This is a confirmation that you have changed Password for your account.</h3>`;
    // No need to await
    sendEmail({
        to: user.email,
        html: message,
        subject: 'Password changed'
    });

    res.json({
        message: 'Password reset successful',
        success: true
    });
});

export {
    loginUser,
    registerUser,
    logout,
    logoutAllDevices,
    refreshAccessToken,
    forgotPassword,
    resetPassword
};
