import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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

// Path to store tokens (in production, use a database instead)
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
 * Save tokens to file
 */
function saveTokens(store: TokenStore): void {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error('Error saving tokens file:', error);
    throw error;
  }
}

/**
 * POST /api/push-tokens
 * Receives and stores push tokens from mobile devices
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
    const tokenData: PushTokenData = req.body;

    // Validate required fields
    if (!tokenData.token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Add timestamp
    tokenData.timestamp = Date.now();

    // Get existing tokens
    const store = getStoredTokens();

    // Check if token already exists
    const existingIndex = store.tokens.findIndex(
      (t) => t.token === tokenData.token
    );

    if (existingIndex !== -1) {
      // Update existing token
      store.tokens[existingIndex] = tokenData;
      console.log('Updated existing token:', tokenData.token);
    } else {
      // Add new token
      store.tokens.push(tokenData);
      console.log('Added new token:', tokenData.token);
    }

    // Save to file (in production, save to database)
    saveTokens(store);

    return res.status(200).json({
      success: true,
      message: 'Token saved successfully',
      tokenCount: store.tokens.length,
    });
  } catch (error) {
    console.error('Error in push-tokens handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/push-tokens (optional)
 * Returns all stored tokens (useful for debugging)
 */
export function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const store = getStoredTokens();
    return res.status(200).json(store);
  } catch (error) {
    console.error('Error getting tokens:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
