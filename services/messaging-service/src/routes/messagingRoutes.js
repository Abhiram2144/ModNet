import express from 'express';
import {
  getModuleMessages,
  getChannelMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  getChannels,
  getChannelById,
} from '../controllers/messagingController.js';

const router = express.Router();

// Message routes
router.get('/messages/module/:moduleId', getModuleMessages);
router.get('/messages/channel/:channelId', getChannelMessages);
router.post('/messages', sendMessage);
router.put('/messages/:messageId', updateMessage);
router.delete('/messages/:messageId', deleteMessage);

// Channel routes
router.get('/channels', getChannels);
router.get('/channels/:channelId', getChannelById);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'messaging-service' });
});

export default router;
