const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(
      requestHandler(req, res, next).catch((err) => {
        console.log("in async handler");
        next(err);
      })
    );
  };
};

export { asyncHandler };
