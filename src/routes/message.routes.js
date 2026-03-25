import { Router } from 'express';
import * as messageController from '../controllers/message.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/conversations', messageController.createConversation);
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.post('/conversations/:conversationId/messages', messageController.sendMessage);
router.patch('/conversations/:conversationId/read', messageController.markAsRead);
router.patch('/conversations/:conversationId/messages/:messageId', messageController.editMessage);
router.delete('/conversations/:conversationId/messages/:messageId', messageController.deleteMessage);
router.get('/unread-count', messageController.getUnreadCount);

export default router;
