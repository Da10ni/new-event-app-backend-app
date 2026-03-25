import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';
import Vendor from '../models/Vendor.model.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import { ApiFeatures } from '../utils/apiFeatures.js';

export const getOrCreateConversation = async (senderId, vendorId, listingId) => {
  // Resolve vendor's userId
  const vendor = await Vendor.findById(vendorId).select('userId');
  if (!vendor) {
    throw new AppError(MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const recipientId = vendor.userId;

  if (senderId.toString() === recipientId.toString()) {
    throw new AppError('You cannot start a conversation with yourself.', HTTP_STATUS.BAD_REQUEST);
  }

  // Check for existing conversation between these two users for this listing
  const filter = {
    participants: { $all: [senderId, recipientId] },
  };
  if (listingId) filter.listing = listingId;

  let conversation = await Conversation.findOne(filter)
    .populate('participants', 'firstName lastName avatar fullName')
    .populate('listing', 'title slug images');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, recipientId],
      listing: listingId || undefined,
      unreadCounts: { [senderId.toString()]: 0, [recipientId.toString()]: 0 },
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName avatar fullName')
      .populate('listing', 'title slug images');
  }

  return conversation;
};

export const sendMessage = async (conversationId, senderId, text, replyTo = null) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError(MESSAGES.MESSAGE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === senderId.toString()
  );
  if (!isParticipant) {
    throw new AppError(MESSAGES.MESSAGE.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  const messageData = {
    conversation: conversationId,
    sender: senderId,
    text,
  };
  if (replyTo) messageData.replyTo = replyTo;

  const message = await Message.create(messageData);

  // Update conversation's lastMessage and bump updatedAt
  conversation.lastMessage = {
    text,
    sender: senderId,
    createdAt: message.createdAt,
  };

  // Increment unread count for the other participant
  for (const participantId of conversation.participants) {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = conversation.unreadCounts.get(participantId.toString()) || 0;
      conversation.unreadCounts.set(participantId.toString(), currentCount + 1);
    }
  }

  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'firstName lastName avatar fullName')
    .populate({ path: 'replyTo', select: 'text sender isDeleted', populate: { path: 'sender', select: 'firstName lastName fullName' } });

  return populatedMessage;
};

export const getUserConversations = async (userId, queryString) => {
  const features = new ApiFeatures(
    Conversation.find({ participants: userId })
      .populate('participants', 'firstName lastName avatar fullName')
      .populate('listing', 'title slug images'),
    queryString
  ).sort().paginate();

  // Override sort to always use updatedAt desc for conversations
  features.query = features.query.sort('-updatedAt');

  await features.countDocuments();
  const conversations = await features.query;
  return { conversations, meta: features.getMeta() };
};

export const getMessages = async (conversationId, userId, queryString) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError(MESSAGES.MESSAGE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId.toString()
  );
  if (!isParticipant) {
    throw new AppError(MESSAGES.MESSAGE.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  const features = new ApiFeatures(
    Message.find({ conversation: conversationId })
      .populate('sender', 'firstName lastName avatar fullName'),
    { ...queryString, sort: 'createdAt' }
  ).sort().paginate();

  await features.countDocuments();
  const messages = await features.query;
  return { messages, meta: features.getMeta() };
};

export const markConversationRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError(MESSAGES.MESSAGE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId.toString()
  );
  if (!isParticipant) {
    throw new AppError(MESSAGES.MESSAGE.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  // Mark all unread messages from the other participant as read
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  // Reset unread count
  conversation.unreadCounts.set(userId.toString(), 0);
  await conversation.save();
};

export const editMessage = async (messageId, userId, newText) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError(MESSAGES.MESSAGE.MESSAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  if (message.sender.toString() !== userId.toString()) {
    throw new AppError(MESSAGES.MESSAGE.NOT_SENDER, HTTP_STATUS.FORBIDDEN);
  }
  if (message.isDeleted) {
    throw new AppError(MESSAGES.MESSAGE.MESSAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  message.text = newText;
  message.isEdited = true;
  await message.save();

  // Update lastMessage on conversation if this was the last message
  const conversation = await Conversation.findById(message.conversation);
  if (conversation && conversation.lastMessage?.createdAt?.getTime() === message.createdAt.getTime()) {
    conversation.lastMessage.text = newText;
    await conversation.save();
  }

  const populated = await Message.findById(message._id)
    .populate('sender', 'firstName lastName avatar fullName')
    .populate({ path: 'replyTo', select: 'text sender isDeleted', populate: { path: 'sender', select: 'firstName lastName fullName' } });
  return populated;
};

export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError(MESSAGES.MESSAGE.MESSAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  if (message.sender.toString() !== userId.toString()) {
    throw new AppError(MESSAGES.MESSAGE.NOT_SENDER, HTTP_STATUS.FORBIDDEN);
  }

  message.text = 'This message was deleted';
  message.isDeleted = true;
  await message.save();

  // Update lastMessage on conversation if this was the last message
  const conversation = await Conversation.findById(message.conversation);
  if (conversation && conversation.lastMessage?.createdAt?.getTime() === message.createdAt.getTime()) {
    conversation.lastMessage.text = 'This message was deleted';
    await conversation.save();
  }

  const populated = await Message.findById(message._id)
    .populate('sender', 'firstName lastName avatar fullName')
    .populate({ path: 'replyTo', select: 'text sender isDeleted', populate: { path: 'sender', select: 'firstName lastName fullName' } });
  return populated;
};

export const getUnreadConversationCount = async (userId) => {
  const conversations = await Conversation.find({ participants: userId });
  let count = 0;
  for (const convo of conversations) {
    const unread = convo.unreadCounts.get(userId.toString()) || 0;
    if (unread > 0) count++;
  }
  return count;
};
