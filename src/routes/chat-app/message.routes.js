import {
    getAllMessages,
    sendMessage
} from '../../controllers/chat-app/message.controllers.js';

import { Router } from 'express';
import errorValidator from '../../validators/errorValidator.js';
import { mongoIdPathVariableValidator } from '../../validators/common/mongodb.validator.js';
import { requireAuthentication } from '../../middlewares/auth.middlewares.js';
import { sendMessageValidator } from '../../validators/chat-app/message.validator.js';

const router = Router();

router.use(requireAuthentication);

router
    .route('/:chatId')
    .get(mongoIdPathVariableValidator('chatId'), errorValidator, getAllMessages)
    .post(
        mongoIdPathVariableValidator('chatId'),
        sendMessageValidator(),
        errorValidator,
        sendMessage
    );

export default router;
