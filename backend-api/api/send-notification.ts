import type { NextApiRequest, NextApiResponse } from 'next';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import fs from 'fs';
import path from 'path';

// Create a new Expo SDK client
const expo = new Expo();

interface PushTokenData {
  token: string;
  deviceId: string | null;
  deviceName: string | null;
  platform: string;
  timestamp?: number;
}

interface TokenStore {
  tokens: PushTokenData[];
}

// Path to stored tokens
const TOKENS_FILE = path.join(process.cwd(), 'push-tokens.json');

/**
 * Get all stored tokens from file
 */
function getStoredTokens(): TokenStore {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading tokens file:', error);
  }
  return { tokens: [] };
}

/**
 * POST /api/send-notification
 * Sends push notifications to one or more devices
 *
 * Request Body:
 * {
 *   "to": "ExponentPushToken[xxx]" | ["ExponentPushToken[xxx]", ...] | "all",
 *   "title": "Notification Title",
 *   "body": "Notification message",
 *   "data": { "key": "value" } (optional)
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, title, body, data } = req.body;

    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'body']
      });
    }

    // Determine target tokens
    let targetTokens: string[] = [];

    if (to === 'all') {
      // Send to all stored tokens
      const store = getStoredTokens();
      targetTokens = store.tokens.map(t => t.token);

      if (targetTokens.length === 0) {
        return res.status(400).json({
          error: 'No tokens found in storage',
          message: 'Register at least one device first'
        });
      }
    } else if (Array.isArray(to)) {
      // Send to multiple specific tokens
      targetTokens = to;
    } else if (typeof to === 'string') {
      // Send to a single token
      targetTokens = [to];
    } else {
      return res.status(400).json({
        error: 'Invalid "to" parameter',
        message: 'Must be a token string, array of tokens, or "all"'
      });
    }

    // Validate all tokens
    const validTokens = targetTokens.filter(token =>
      Expo.isExpoPushToken(token)
    );

    if (validTokens.length === 0) {
      return res.status(400).json({
        error: 'No valid Expo push tokens found',
        invalidTokens: targetTokens
      });
    }

    // Create messages
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log('Sent chunk:', ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }

    // Check for errors in tickets
    const successCount = tickets.filter(ticket => ticket.status === 'ok').length;
    const errorTickets = tickets.filter(ticket => ticket.status === 'error');

    return res.status(200).json({
      success: true,
      sent: successCount,
      total: tickets.length,
      errors: errorTickets.length > 0 ? errorTickets : undefined,
      tickets,
    });

  } catch (error) {
    console.error('Error in send-notification handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
