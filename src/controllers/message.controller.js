import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { sendResponse } from '../utils/apiResponse.js';
import { MESSAGES } from '../constants/index.js';
import * as messageService from '../services/message.service.js';
import { getIO } from '../config/socket.js';

export const createConversation = asyncHandler(async (req, res) => {
  const { vendorId, listingId, message } = req.body;

  const conversation = await messageService.getOrCreateConversation(
    req.user._id,
    vendorId,
    listingId
  );

  // If an initial message was provided, send it
  let firstMessage = null;
  if (message) {
    firstMessage = await messageService.sendMessage(
      conversation._id,
      req.user._id,
      message
    );

    // Emit real-time events
    const io = getIO();
    if (io) {
      const recipientId = conversation.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      io.to(`conversation:${conversation._id}`).emit('new_message', firstMessage);
      if (recipientId) {
        io.to(`user:${recipientId._id}`).emit('conversation_updated', {
          conversationId: conversation._id,
        });
      }
    }
  }

  sendResponse(res, {
    statusCode: 201,
    message: MESSAGES.MESSAGE.CONVERSATION_CREATED,
    data: { conversation, message: firstMessage },
  });
});

export const getConversations = asyncHandler(async (req, res) => {
  const { conversations, meta } = await messageService.getUserConversations(
    req.user._id,
    req.query
  );
  sendResponse(res, {
    message: MESSAGES.GENERAL.SUCCESS,
    data: { conversations },
    meta,
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { messages, meta } = await messageService.getMessages(
    req.params.conversationId,
    req.user._id,
    req.query
  );
  sendResponse(res, {
    message: MESSAGES.GENERAL.SUCCESS,
    data: { messages },
    meta,
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await messageService.sendMessage(
    req.params.conversationId,
    req.user._id,
    req.body.text,
    req.body.replyTo || null
  );

  // Emit real-time events
  const io = getIO();
  if (io) {
    const conversation = await (await import('../models/Conversation.model.js')).default
      .findById(req.params.conversationId)
      .populate('participants', '_id');

    io.to(`conversation:${req.params.conversationId}`).emit('new_message', message);

    if (conversation) {
      const recipientId = conversation.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      if (recipientId) {
        io.to(`user:${recipientId._id}`).emit('conversation_updated', {
          conversationId: req.params.conversationId,
        });
      }
    }
  }

  sendResponse(res, {
    statusCode: 201,
    message: MESSAGES.MESSAGE.SENT,
    data: { message },
  });
});

export const editMessage = asyncHandler(async (req, res) => {
  const updated = await messageService.editMessage(
    req.params.messageId,
    req.user._id,
    req.body.text
  );

  const io = getIO();
  if (io) {
    io.to(`conversation:${updated.conversation}`).emit('message_edited', updated);
  }

  sendResponse(res, {
    message: MESSAGES.MESSAGE.EDITED,
    data: { message: updated },
  });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const updated = await messageService.deleteMessage(
    req.params.messageId,
    req.user._id
  );

  const io = getIO();
  if (io) {
    io.to(`conversation:${updated.conversation}`).emit('message_deleted', updated);
  }

  sendResponse(res, {
    message: MESSAGES.MESSAGE.DELETED,
    data: { message: updated },
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  await messageService.markConversationRead(
    req.params.conversationId,
    req.user._id
  );
  sendResponse(res, { message: MESSAGES.MESSAGE.MARKED_READ });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await messageService.getUnreadConversationCount(req.user._id);
  sendResponse(res, {
    message: MESSAGES.GENERAL.SUCCESS,
    data: { count },
  });
});
