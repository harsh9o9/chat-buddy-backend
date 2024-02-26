import { ApiResponse } from '../../utils/ApiResponse.js';
import { Chat } from '../../models/chat-app/chat.modals.js';
import { ChatEvents } from '../../constants.js';
import { ChatMessage } from '../../models/chat-app/message.models.js';
import { CustomError } from '../../utils/CustomError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { emitSocketEventToAll } from '../../socket/index.js';
import mongoose from 'mongoose';

// adds username, email, avatar, fullName of sender
const chatMessageCommonAggregation = () => {
    return [
        {
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
    ];
};

const getAllMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const selectedChat = await Chat.findById(chatId);

    if (!selectedChat) {
        console.log('message controller 404');
        throw new CustomError('Chat does not exist', 404);
    }

    // Only send messages if the logged in user is a part of the chat he is requesting messages of
    if (!selectedChat.participants?.includes(req.user?._id)) {
        throw new CustomError('User is not a part of this chat', 400);
    }

    const messages = await ChatMessage.aggregate([
        {
            $match: {
                chat: new mongoose.Types.ObjectId(chatId)
            }
        },
        ...chatMessageCommonAggregation(),
        {
            $sort: {
                createdAt: -1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                messages || [],
                'Messages fetched successfully'
            )
        );
});

const sendMessage = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new CustomError('Message content is required', 400);
    }

    const selectedChat = await Chat.findById(chatId);

    if (!selectedChat) {
        console.log('message controller 404 2');
        throw new CustomError('Chat does not exist', 404);
    }

    // Create a new message instance with appropriate metadata
    const message = await ChatMessage.create({
        sender: new mongoose.Types.ObjectId(req.user._id),
        content: content || '',
        chat: new mongoose.Types.ObjectId(chatId)
    });

    // update the chat's last message which could be utilized to show last message in the list item
    const chat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $set: {
                lastMessage: message._id
            }
        },
        { new: true }
    );

    // structure the message
    const messages = await ChatMessage.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(message._id)
            }
        },
        ...chatMessageCommonAggregation()
    ]);

    // Store the aggregation result
    const receivedMessage = messages[0];

    if (!receivedMessage) {
        throw new CustomError('Internal server error', 500);
    }

    chat?.participants.forEach((participantId) => {
        // avoiding emitting event to the user who is sending the message
        if (participantId.toString() === req.user._id.toString()) return;

        emitSocketEventToAll(
            req,
            participantId.toString(),
            ChatEvents.MESSAGE_RECEIVED_EVENT,
            receivedMessage
        );
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, receivedMessage, 'Message saved successfully')
        );
});

export { getAllMessages, sendMessage };
