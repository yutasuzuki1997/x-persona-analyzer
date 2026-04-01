const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// POST /claude
app.post('/claude', async (req, res) => {
  const { api_key, ...body } = req.body;
  if (!api_key) return res.status(400).json({ error: 'api_key は必須です' });

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Claude APIエラー', detail: err.message });
  }
});

// GET /replies
app.get('/replies', async (req, res) => {
  const { tweet_id, bearer_token, max_results = 20 } = req.query;

  if (!tweet_id || !bearer_token) {
    return res.status(400).json({ error: 'tweet_id と bearer_token は必須です' });
  }

  const headers = { Authorization: `Bearer ${bearer_token}` };

  try {
    // 元ツイート取得
    const tweetUrl = new URL(`https://api.twitter.com/2/tweets/${tweet_id}`);
    tweetUrl.searchParams.set('tweet.fields', 'text,author_id,created_at,public_metrics');
    tweetUrl.searchParams.set('expansions', 'author_id');
    tweetUrl.searchParams.set('user.fields', 'name,username,description,public_metrics,profile_image_url');

    const tweetRes = await fetch(tweetUrl.toString(), { headers });
    const tweetData = await tweetRes.json();

    if (!tweetRes.ok) {
      return res.status(tweetRes.status).json({ error: '元ツイートの取得に失敗しました', detail: tweetData });
    }

    const originalTweet = tweetData.data;
    const originalAuthor = tweetData.includes?.users?.[0] ?? null;
    console.log("[DEBUG] originalTweet:", JSON.stringify(tweetData, null, 2));

    // リプライ取得（ページネーション対応）
    const maxTotal = Math.min(parseInt(max_results) || 100, 500);
    let allReplies = [];
    let allUsers = [];
    let nextToken = null;

    do {
      const params = new URLSearchParams({
        query: `conversation_id:${tweet_id}`,
        max_results: Math.max(10, Math.min(100, maxTotal - allReplies.length)),
        'tweet.fields': 'text,author_id,created_at,public_metrics,in_reply_to_user_id',
        expansions: 'author_id',
        'user.fields': 'name,username,description,public_metrics',
      });
      if (nextToken) params.set('next_token', nextToken);

      console.log("[DEBUG] search URL:", `https://api.twitter.com/2/tweets/search/recent?${params}`);

      const searchRes = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?${params}`,
        { headers }
      );
      const searchData = await searchRes.json();
      console.log("[DEBUG] searchData:", JSON.stringify(searchData, null, 2));

      if (!searchRes.ok) {
        return res.status(searchRes.status).json({ error: 'リプライの取得に失敗しました', detail: searchData });
      }

      allReplies = allReplies.concat(searchData.data ?? []);
      allUsers = allUsers.concat(searchData.includes?.users ?? []);
      nextToken = searchData.meta?.next_token;

    } while (nextToken && allReplies.length < maxTotal);

    console.log("[DEBUG] totalReplies:", allReplies.length);

    // 重複ユーザーを除去
    const uniqueUsers = Object.values(
      allUsers.reduce((acc, u) => ({ ...acc, [u.id]: u }), {})
    );

    return res.json({
      originalTweet,
      originalAuthor,
      replies: allReplies,
      users: uniqueUsers,
      totalFetched: allReplies.length,
    });
  } catch (err) {
    return res.status(500).json({ error: 'サーバーエラー', detail: err.message });
  }
});

// GET /user-context
app.get('/user-context', async (req, res) => {
  const { user_id, bearer_token } = req.query;

  if (!user_id || !bearer_token) {
    return res.status(400).json({ error: 'user_id と bearer_token は必須です' });
  }

  const headers = { Authorization: `Bearer ${bearer_token}` };

  try {
    const url = new URL(`https://api.twitter.com/2/users/${user_id}/tweets`);
    url.searchParams.set('max_results', '10');
    url.searchParams.set('tweet.fields', 'text,created_at');

    const tweetsRes = await fetch(url.toString(), { headers });
    const tweetsData = await tweetsRes.json();

    if (!tweetsRes.ok) {
      return res.status(tweetsRes.status).json({ error: '最近のツイート取得に失敗しました', detail: tweetsData });
    }

    return res.json({ recentTweets: tweetsData.data ?? [] });
  } catch (err) {
    return res.status(500).json({ error: 'サーバーエラー', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ X API Proxy起動中: http://localhost:${PORT}`);
});
