import jwt from "jsonwebtoken";

const generateAccessToken = function (userId, userEmail, username) {
  try {
    const accessToken = jwt.sign(
      {
        _id: userId,
        _email: userEmail,
        _username: username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    return accessToken;
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access token"
    );
  }
};

export default generateAccessToken;
