const SCORE_CACHE = 'score-store-v1';
const SCORE_KEY = 'score-data';
const ITEM_STATS_KEY = 'item-stats-data';

async function readScores() {
  const cache = await caches.open(SCORE_CACHE);
  const match = await cache.match(SCORE_KEY);
  if (!match) {
    return {};
  }

  try {
    return await match.json();
  } catch (error) {
    console.warn('[score-sw] Failed to parse stored scores', error);
    return {};
  }
}

async function writeScores(data) {
  const cache = await caches.open(SCORE_CACHE);
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });

  await cache.put(SCORE_KEY, response);
}

async function readItemStats() {
  const cache = await caches.open(SCORE_CACHE);
  const match = await cache.match(ITEM_STATS_KEY);
  if (!match) {
    return {};
  }

  try {
    return await match.json();
  } catch (error) {
    console.warn('[score-sw] Failed to parse stored item stats', error);
    return {};
  }
}

async function writeItemStats(data) {
  const cache = await caches.open(SCORE_CACHE);
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });

  await cache.put(ITEM_STATS_KEY, response);
}

async function broadcastScores(scores) {
  const clientList = await self.clients.matchAll({ type: 'window' });
  for (const client of clientList) {
    client.postMessage({ type: 'SCORES_UPDATED', payload: scores });
  }
}

async function broadcastItemStats(itemStats) {
  const clientList = await self.clients.matchAll({ type: 'window' });
  for (const client of clientList) {
    client.postMessage({ type: 'ITEM_STATS_UPDATED', payload: itemStats });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (!data.type) return;

  if (data.type === 'SAVE_SCORE') {
    event.waitUntil(
      (async () => {
        const { category, correct, total, timestamp } = data.payload || {};
        if (!category || typeof correct !== 'number' || typeof total !== 'number') {
          return;
        }

        const scores = await readScores();
        const existing = scores[category] || { sessions: 0 };
        scores[category] = {
          sessions: (existing.sessions || 0) + 1,
          lastScore: {
            correct,
            total,
            timestamp: typeof timestamp === 'number' ? timestamp : Date.now()
          }
        };

        await writeScores(scores);
        await broadcastScores(scores);
      })()
    );
  }

  if (data.type === 'REQUEST_SCORES') {
    event.waitUntil(
      (async () => {
        const scores = await readScores();
        if (event.source && 'postMessage' in event.source) {
          event.source.postMessage({ type: 'SCORES_UPDATED', payload: scores });
        } else {
          await broadcastScores(scores);
        }
      })()
    );
  }

  if (data.type === 'CLEAR_SCORES') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(SCORE_CACHE);
        await cache.delete(SCORE_KEY);
        await broadcastScores({});
      })()
    );
  }

  if (data.type === 'SAVE_ITEM_STATS') {
    event.waitUntil(
      (async () => {
        const { itemKey, stats } = data.payload || {};
        if (!itemKey || !stats) {
          return;
        }

        const itemStats = await readItemStats();
        itemStats[itemKey] = stats;

        await writeItemStats(itemStats);
        await broadcastItemStats(itemStats);
      })()
    );
  }

  if (data.type === 'REQUEST_ITEM_STATS') {
    event.waitUntil(
      (async () => {
        const itemStats = await readItemStats();
        if (event.source && 'postMessage' in event.source) {
          event.source.postMessage({ type: 'ITEM_STATS_UPDATED', payload: itemStats });
        } else {
          await broadcastItemStats(itemStats);
        }
      })()
    );
  }
});
