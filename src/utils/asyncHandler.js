/**
 * Wraps an asynchronous request handler function, catching any errors and passing them to the next middleware.
 *
 * @param {Function} requestHandler - The asynchronous request handler function.
 * @returns {Function} Express middleware function.
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(
            requestHandler(req, res, next).catch((err) => {
                console.error('Error in async handler: ', err);
                next(err);
            })
        );
    };
};

export { asyncHandler };
