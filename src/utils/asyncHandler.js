const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(
      requestHandler(req, res, next).catch((err) => {
        console.log("in async handler: ", err);
        next(err);
      })
    );
  };
};

export { asyncHandler };
