import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import generateAccessToken from "../utils/generateAccessToken.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  if (!username || !fullName || !password || !email) {
    throw new ApiError(
      400,
      "username, email, fullname and password are required"
    );
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "username or email already exists");
  }

  const user = await User.create({
    email,
    username,
    fullName,
    password,
  });
  await user.save();

  const accessToken = generateAccessToken(user._id, user.email, user.username);

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const accessTokenOptions = { httpOnly: true, withCredentials: true };

  return res
    .status(201)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new ApiError(400, "username and password are required");
  }

  let user = await User.findOne({ username: username });

  if (!user) {
    console.log("user controller 404");
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const accessToken = generateAccessToken(user._id, user.email, user.username);

  const userDataToSend = await User.findById(user._id).select("-password");

  const accessTokenOptions = { httpOnly: true, withCredentials: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .json(
      new ApiResponse(
        200,
        { user: userDataToSend, accessToken }, // sending access token in response if client decides to save it
        "User logged in successfully"
      )
    );
});

export { loginUser, registerUser };
