import mongoose, { Schema } from 'mongoose';

import { CustomError } from '../utils/CustomError.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Pull in Environment variables
const ACCESS_TOKEN = {
    secret: process.env.AUTH_ACCESS_TOKEN_SECRET,
    expiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY
};
const REFRESH_TOKEN = {
    secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
    expiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY
};
const RESET_PASSWORD_TOKEN = {
    expiry: process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS
};

/* 
1. CREATE USER SCHEMA
 */

// Define the Fullname Schema
const fullnameSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    }
});

const UserSchema = new Schema(
    {
        avatar: {
            type: {
                url: String
            },
            default: {
                url: `https://picsum.photos/200`
            }
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: fullnameSchema,
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        tokens: [
            {
                token: { required: true, type: String } // for storing refresh tokens
            }
        ],
        resetpasswordtoken: String,
        resetpasswordtokenexpiry: Date
    },
    { timestamps: true }
);

/* 
2. SET SCHEMA OPTION
 */

// removing unnessery things from response
UserSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret, options) {
        delete ret.password;
        delete ret.tokens;
        return ret;
    }
});

/**
 * 3. ATTACH MIDDLEWARE
 */
UserSchema.pre('save', async function (next) {
    try {
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * 4. ATTACH CUSTOM STATIC METHODS
 */

UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user)
        throw new CustomError(
            'Wrong credentials!',
            400,
            'Email or password is wrong!'
        );
    const passwdMatch = await bcrypt.compare(password, user.password);
    if (!passwdMatch)
        throw new CustomError(
            'Wrong credentials!',
            400,
            'Email or password is wrong!'
        );
    return user;
};

UserSchema.methods.generateAcessToken = function () {
    const user = this;

    // Create signed access token
    const accessToken = jwt.sign(
        {
            _id: user._id.toString(),
            email: user.email,
            username: user.username
        },
        ACCESS_TOKEN.secret,
        {
            expiresIn: ACCESS_TOKEN.expiry
        }
    );

    return accessToken;
};

UserSchema.methods.generateRefreshToken = async function () {
    const user = this;

    // Create signed refresh token
    const refreshToken = jwt.sign(
        {
            _id: user._id.toString()
        },
        REFRESH_TOKEN.secret,
        {
            expiresIn: REFRESH_TOKEN.expiry
        }
    );

    // Create a 'refresh token hash' from 'refresh token'
    const rTknHash = crypto
        .createHmac('sha256', REFRESH_TOKEN.secret)
        .update(refreshToken)
        .digest('hex');

    // Save 'refresh token hash' to database
    user.tokens.push({ token: rTknHash });
    await user.save();

    return refreshToken;
};

// Not used yet, will be used in password reset flow
UserSchema.methods.generateResetToken = async function () {
    const resetTokenValue = crypto.randomBytes(20).toString('base64url');
    const resetTokenSecret = crypto.randomBytes(10).toString('hex');
    const user = this;

    // Separator of `+` because generated base64url characters doesn't include this character
    const resetToken = `${resetTokenValue}+${resetTokenSecret}`;

    // Create a hash
    const resetTokenHash = crypto
        .createHmac('sha256', resetTokenSecret)
        .update(resetTokenValue)
        .digest('hex');

    user.resetpasswordtoken = resetTokenHash;
    user.resetpasswordtokenexpiry =
        Date.now() + (RESET_PASSWORD_TOKEN.expiry || 5) * 60 * 1000; // Sets expiration age

    await user.save();

    return resetToken;
};

/**
 * 6. COMPILE MODEL FROM SCHEMA
 */

export const User = mongoose.model('User', UserSchema);
