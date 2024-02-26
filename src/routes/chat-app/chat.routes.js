import {
    createOrGetAOneOnOneChat,
    getAllChats,
    searchAvailableUsers
} from '../../controllers/chat-app/chat.controllers.js';

import { Router } from 'express';
import errorValidator from '../../validators/errorValidator.js';
import { mongoIdPathVariableValidator } from '../../validators/common/mongodb.validator.js';
import { requireAuthentication } from '../../middlewares/auth.middlewares.js';

const router = Router();

router.use(requireAuthentication);

router.route('/').get(getAllChats);
router.route('/users').get(searchAvailableUsers);

router
    .route('/c/:receiverId')
    .post(
        mongoIdPathVariableValidator('receiverId'),
        errorValidator,
        createOrGetAOneOnOneChat
    );

export default router;
