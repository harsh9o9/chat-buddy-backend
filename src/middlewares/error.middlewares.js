import { CustomError } from '../utils/CustomError.js';
import mongoose from 'mongoose';
/**
 * @description This middleware is responsible to catch the errors from any request handler wrapped inside the {@link asyncHandler}
 */

const errorHandler = (err, req, res, next) => {
    let error = err;

    console.log('in errorhandler: ', error);

    /**
     * if error is not instance of {@link CustomError} then create a instance to maitain consistency
     */
    if ((!error) instanceof CustomError) {
        console.log('!error instanceof CustomError');
        // if error related to mongoose then 400 (Bad Request) else 500 (Server Error)
        const statusCode = error instanceof mongoose.Error ? 400 : 500;

        const message = error?.message || 'something went wrong';
        error = new CustomError(
            message,
            statusCode,
            error?.errors || [],
            error?.stack
        );
    }

    // creating response to send to user in case of error
    const response = {
        message: error?.cause || error?.message,
        feedback: error?.feedback,
        ...(process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : {})
    };

    if (error.authorizationError === true) {
        // Sets headers available in Authorization Error object
        res.set(err.authHeaders);
    }

    return res.status(error.status || 500).json(response);
};

export default errorHandler;
