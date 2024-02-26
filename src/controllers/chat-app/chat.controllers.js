import { ApiResponse } from '../../utils/ApiResponse.js';
import { Chat } from '../../models/chat-app/chat.modals.js';
import { ChatEvents } from '../../constants.js';
import { CustomError } from '../../utils/CustomError.js';
import { User } from '../../models/user.models.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { emitSocketEventToAll } from '../../socket/index.js';
import mongoose from 'mongoose';

// some common aggregation that needs to be applied multiple times (basically it replaces details of users present in participant field)
const chatCommonAggregation = () => {
    return [
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'participants',
                as: 'participants',
                pipeline: [
                    {
                        $project: {
                            password: 0
                        }
                    }
                ]
            }
        },
        {
            // lookup for the chats
            $lookup: {
                from: 'chatmessages',
                foreignField: '_id',
                localField: 'lastMessage',
                as: 'lastMessage',
                pipeline: [
                    {
                        // get details of the sender
                        $lookup: {
                            from: 'users',
                            foreignField: '_id',
                            localField: 'sender',
                            as: 'sender',
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        email: 1,
                                        fullName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            sender: { $first: '$sender' }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                lastMessage: { $first: '$lastMessage' }
            }
        }
    ];
};

// returns all chats where currently logged in member in a participant
const getAllChats = asyncHandler(async (req, res) => {
    const chats = await Chat.aggregate([
        {
            $match: {
                participants: { $elemMatch: { $eq: req.user._id } } // get all chats that have logged in user as a participant
            }
        },
        {
            $sort: {
                updatedAt: -1
            }
        },
        ...chatCommonAggregation()
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                chats || [],
                'User chats fetched successfully!'
            )
        );
});

// returns all users except current user
const searchAvailableUsers = asyncHandler(async (req, res) => {
    const users = await User.aggregate([
        {
            $match: {
                _id: {
                    $ne: req.user._id // avoid logged in user
                }
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, users, 'Users fetched successfully'));
});

// create a one on one chat with another user (adds a new one on one chat entry in chat document)
const createOrGetAOneOnOneChat = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    console.log('receiverId: ', receiverId);

    // Check if it's a valid receiver
    const receiver = await User.findById(receiverId);
    console.log('receiver: ', receiver);

    if (!receiver) {
        console.log('in you receiver');
        throw new CustomError('Receiver does not exist', 404);
    }

    // check if receiver is not the user who is requesting a chat
    if (receiver._id.toString() === req.user._id.toString()) {
        console.log('in you cannot with youreself');
        throw new CustomError('You cannot chat with yourself', 400);
    }

    // finding chats with user and receiver in it, if any
    const chat = await Chat.aggregate([
        {
            $match: {
                isGroupChat: false, // avoid group chats. This controller is responsible for one on one chats
                // Also, we filter chats with participants having receiver and logged in user only
                $and: [
                    {
                        participants: { $elemMatch: { $eq: req.user._id } }
                    },
                    {
                        participants: {
                            $elemMatch: {
                                $eq: new mongoose.Types.ObjectId(receiverId)
                            }
                        }
                    }
                ]
            }
        },
        ...chatCommonAggregation()
    ]);

    // if we find the chat that means user already has created a chat
    if (chat.length > 0) {
        console.log('if there is a chat');
        return res
            .status(200)
            .json(new ApiResponse(200, chat[0], 'Chat retrieved successfully'));
    }

    // if not we need to create a new one on one chat
    const newChatInstance = await Chat.create({
        name: 'One on one chat',
        participants: [req.user._id, new mongoose.Types.ObjectId(receiverId)], // add receiver and logged in user as participants
        admin: req.user._id
    });

    // creating chat object to send to user as payload (with participants details)
    const createdChat = await Chat.aggregate([
        {
            $match: {
                _id: newChatInstance._id
            }
        },
        ...chatCommonAggregation()
    ]);

    const payload = createdChat[0]; // store the aggregation result

    if (!payload) {
        throw new CustomError('Internal server error', 500);
    }

    payload?.participants.forEach((participant) => {
        console.log('in participant: ', participant._id.toString());
        if (participant._id.toString() === req.user._id.toString()) return;
        // emit event to other participants with new chat as a payload
        emitSocketEventToAll(
            req,
            participant?._id.toString(),
            ChatEvents.NEW_CHAT_EVENT,
            payload
        );
    });

    return res
        .status(201)
        .json(new ApiResponse(201, payload, 'Chat retrieved successfully'));
});

export { getAllChats, searchAvailableUsers, createOrGetAOneOnOneChat };
