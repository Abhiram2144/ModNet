import { supabase } from '../utils/supabase.js';

class MessagingService {
  /**
   * Get messages for a module
   */
  async getModuleMessages(moduleId, limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          senderid,
          moduleid,
          channelid,
          replyto,
          createdat,
          students:senderid (id, displayname, profileimage)
        `)
        .eq('moduleid', moduleId)
        .is('channelid', null)
        .order('createdat', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch module messages: ${error.message}`);
    }
  }

  /**
   * Get messages for a channel/group
   */
  async getChannelMessages(channelId, limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          senderid,
          moduleid,
          channelid,
          replyto,
          createdat,
          students:senderid (id, displayname, profileimage)
        `)
        .eq('channelid', channelId)
        .order('createdat', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch channel messages: ${error.message}`);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          content: messageData.content,
          senderid: messageData.senderId,
          moduleid: messageData.moduleId || null,
          channelid: messageData.channelId || null,
          replyto: messageData.replyTo || null,
        }])
        .select(`
          id,
          content,
          senderid,
          moduleid,
          channelid,
          replyto,
          createdat,
          students:senderid (id, displayname, profileimage)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Update a message
   */
  async updateMessage(messageId, senderId, content) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ content })
        .eq('id', messageId)
        .eq('senderid', senderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId, senderId) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('senderid', senderId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  /**
   * Get channels
   */
  async getChannels() {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, name, description, createdat')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch channels: ${error.message}`);
    }
  }

  /**
   * Get channel by ID
   */
  async getChannelById(channelId) {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, name, description, createdat')
        .eq('id', channelId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch channel: ${error.message}`);
    }
  }
}

export default new MessagingService();
