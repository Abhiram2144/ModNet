import messagingService from '../services/messagingService.js';

export const getModuleMessages = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const messages = await messagingService.getModuleMessages(
      moduleId,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Get module messages error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const messages = await messagingService.getChannelMessages(
      channelId,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Get channel messages error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const messageData = req.body;
    const message = await messagingService.sendMessage(messageData);
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { senderId, content } = req.body;
    
    const message = await messagingService.updateMessage(messageId, senderId, content);
    res.json(message);
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { senderId } = req.body;
    
    await messagingService.deleteMessage(messageId, senderId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getChannels = async (req, res) => {
  try {
    const channels = await messagingService.getChannels();
    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getChannelById = async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await messagingService.getChannelById(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: error.message });
  }
};
