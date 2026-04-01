const { db } = require('./db');
const { now } = require('./utils');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function validExpoToken(token = '') {
  return /^Expo(nent)?PushToken\[.+\]$/.test(String(token || ''));
}

async function sendPushToUser(userId, { title, body, data = {} } = {}) {
  if (!userId || !title || !body) return { ok: false, reason: 'invalid_payload' };

  const rows = db.prepare(`
    SELECT id, expo_push_token
    FROM user_push_tokens
    WHERE user_id = ? AND is_active = 1
    ORDER BY last_seen_at DESC
  `).all(userId);

  if (!rows.length) return { ok: false, reason: 'no_tokens' };

  const messages = rows
    .filter((row) => validExpoToken(row.expo_push_token))
    .map((row) => ({
      to: row.expo_push_token,
      title,
      body,
      sound: 'default',
      channelId: 'messages',
      data,
    }));

  if (!messages.length) return { ok: false, reason: 'no_valid_tokens' };

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const json = await response.json().catch(() => ({}));

    const ticketRows = Array.isArray(json?.data) ? json.data : [];
    ticketRows.forEach((ticket, index) => {
      if (ticket?.details?.error === 'DeviceNotRegistered') {
        const token = messages[index]?.to;
        if (token) {
          db.prepare('UPDATE user_push_tokens SET is_active = 0, last_seen_at = ? WHERE expo_push_token = ?').run(now(), token);
        }
      }
    });

    return { ok: response.ok, response: json };
  } catch (error) {
    return { ok: false, reason: error?.message || 'push_failed' };
  }
}

module.exports = { sendPushToUser, validExpoToken };
