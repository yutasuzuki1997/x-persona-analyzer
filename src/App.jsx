import React, { useState } from 'react';

const PROXY = "http://localhost:3001";

const STEPS = {
  SETUP: "SETUP",
  INPUT: "INPUT",
  FETCHING: "FETCHING",
  ANALYZING: "ANALYZING",
  RESULT: "RESULT",
};

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&display=swap');
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; }
  input::placeholder, textarea::placeholder { color: #404060; }
  input:focus, textarea:focus { outline: none; border-color: #6366f188 !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #13131f; }
  ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 2px; }
`;

// ────────────────────────────────────────────────────────────────────────────────
// 共通スタイル定数
// ────────────────────────────────────────────────────────────────────────────────
const S = {
  base: {
    fontFamily: "'Noto Sans JP', sans-serif",
    background: '#0a0a0f',
    minHeight: '100vh',
    color: '#e0e0f0',
    padding: '40px 20px',
  },
  card: {
    background: '#0d0d18',
    border: '1px solid #2a2a3e',
    borderRadius: 16,
    padding: 32,
    maxWidth: 820,
    margin: '0 auto',
  },
  input: {
    width: '100%',
    background: '#13131f',
    border: '1px solid #2a2a3e',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#e0e0f0',
    fontSize: 14,
  },
  label: {
    display: 'block',
    color: '#7070a0',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  sectionLabel: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: 700,
    letterSpacing: 3,
    marginBottom: 10,
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// 3重スピナー
// ────────────────────────────────────────────────────────────────────────────────
function TripleSpinner() {
  const ring = (size, color, duration, dir = 1) => ({
    position: 'absolute',
    width: size, height: size,
    border: '3px solid transparent',
    borderTopColor: color,
    borderRadius: '50%',
    animation: `spin ${duration}s linear infinite`,
    animationDirection: dir < 0 ? 'reverse' : 'normal',
    top: (80 - size) / 2,
    left: (80 - size) / 2,
  });

  return (
    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
      <div style={ring(80, '#6366f1', 1.0)} />
      <div style={ring(58, '#8b5cf6', 1.6, -1)} />
      <div style={ring(36, '#06b6d4', 2.2)} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// PersonaPanel
// ────────────────────────────────────────────────────────────────────────────────
function PersonaPanel({ persona, accent, label, emoji }) {
  if (!persona) return null;
  return (
    <div style={{
      background: '#13131f',
      border: `1px solid ${accent}44`,
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* バッジ + 件数 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          background: `${accent}1a`,
          color: accent,
          border: `1px solid ${accent}55`,
          borderRadius: 20,
          padding: '3px 12px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
        }}>{label}</span>
        {persona.count != null && (
          <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>
            {persona.count}件 ({persona.percentage}%)
          </span>
        )}
      </div>

      {/* タイトル */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
          {persona.title}
        </span>
      </div>

      {/* 説明 */}
      <p style={{ color: '#9090b0', fontSize: 13, lineHeight: 1.75 }}>
        {persona.description}
      </p>

      {/* タグ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(persona.tags ?? []).map((tag, i) => (
          <span key={i} style={{
            background: `${accent}14`,
            color: accent,
            border: `1px solid ${accent}44`,
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
          }}>#{tag}</span>
        ))}
      </div>

      {/* 代表投稿 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(persona.representativePosts ?? []).map((post, i) => (
          <div key={i} style={{
            borderLeft: `3px solid ${accent}`,
            paddingLeft: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}>
            <span style={{ fontSize: 11, color: accent, fontWeight: 700 }}>{post.username}</span>
            <span style={{ color: '#c0c0e0', fontSize: 12, lineHeight: 1.65 }}>「{post.text}」</span>
            <span style={{ color: '#606080', fontSize: 11, lineHeight: 1.5 }}>{post.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────────────────────────────────────────
export default function CommentPersonaAnalyzer() {
  const [bearerToken, setBearerToken] = useState(() => localStorage.getItem('x_bearer_token') ?? '');
  const [claudeApiKey, setClaudeApiKey] = useState(() => localStorage.getItem('x_claude_api_key') ?? '');
  const [step, setStep] = useState(() =>
    localStorage.getItem('x_bearer_token') && localStorage.getItem('x_claude_api_key')
      ? STEPS.INPUT
      : STEPS.SETUP
  );
  const [tweetUrl, setTweetUrl] = useState('');
  const [fetchLog, setFetchLog] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const addLog = (msg) => setFetchLog(prev => [...prev, msg]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Claude API 分析
  // ──────────────────────────────────────────────────────────────────────────────
  const analyze = async (xData, userContextMap) => {
    const { originalTweet, originalAuthor, replies, users } = xData;

    const userMap = {};
    (users ?? []).forEach(u => { userMap[u.id] = u; });

    const originalFollowers = originalAuthor?.public_metrics?.followers_count ?? 0;

    const lines = [];
    lines.push('【元ポスト】');
    lines.push(
      `@${originalAuthor?.username}（フォロワー${originalFollowers.toLocaleString()}）: ${originalTweet?.text}`
    );
    lines.push('');
    lines.push(`【リプライ一覧（${replies?.length ?? 0}件）】`);
    (replies ?? []).forEach(reply => {
      const user = userMap[reply.author_id];
      const followers = user?.public_metrics?.followers_count ?? 0;
      lines.push(
        `[${user?.username ?? reply.author_id} / フォロワー${followers.toLocaleString()}] ${reply.text}`
      );
    });
    lines.push('');
    lines.push('【コメント者の投稿傾向サンプル】');
    Object.entries(userContextMap).forEach(([userId, tweets]) => {
      const user = userMap[userId];
      if (!user) return;
      const followers = user.public_metrics?.followers_count ?? 0;
      lines.push(`@${user.username}（フォロワー${followers.toLocaleString()}）`);
      if (user.description) lines.push(`プロフィール: ${user.description}`);
      if (tweets.length > 0) {
        lines.push(`最近の投稿: ${tweets.map(t => t.text).join(' / ')}`);
      }
      lines.push('');
    });

    const systemPrompt = `あなたはSNSコメント分析の専門家です。
与えられた投稿へのリプライ全件を分析し、以下をJSON形式で返してください。

{
  "postSummary": "元ポストの内容を1文で要約",
  "totalReplies": リプライの総件数（整数）,
  "aiAccounts": {
    "percentage": AIっぽいアカウントの割合（0〜100の整数）,
    "description": "AIアカウントと判断した根拠（botらしい投稿パターン・フォロワー比率など）",
    "usernames": ["疑わしいusername1", "疑わしいusername2"]
  },
  "supporters": {
    "count": 賛同リプライの件数（整数）,
    "percentage": 全体に占める割合（0〜100の整数）,
    "title": "賛同者の典型像",
    "description": "賛同者の特徴・背景・価値観（2〜3文）",
    "tags": ["キーワード1", "キーワード2", "キーワード3"],
    "representativePosts": [
      { "username": "@ユーザー名", "text": "投稿本文", "reason": "この投稿が代表的な理由" },
      { "username": "@ユーザー名", "text": "投稿本文", "reason": "この投稿が代表的な理由" }
    ]
  },
  "critics": {
    "count": 批判リプライの件数（整数）,
    "percentage": 全体に占める割合（0〜100の整数）,
    "title": "批判者の典型像",
    "description": "批判者の特徴・背景・価値観（2〜3文）",
    "tags": ["キーワード1", "キーワード2", "キーワード3"],
    "representativePosts": [
      { "username": "@ユーザー名", "text": "投稿本文", "reason": "この投稿が代表的な理由" },
      { "username": "@ユーザー名", "text": "投稿本文", "reason": "この投稿が代表的な理由" }
    ]
  },
  "insight": "全体から得られる洞察（1〜2文）"
}

必ずJSONのみを返してください。\`\`\`jsonブロックで囲んでも構いません。説明文は不要です。`;

    const apiRes = await fetch(`${PROXY}/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: claudeApiKey,
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: lines.join('\n') }],
      }),
    });

    if (!apiRes.ok) {
      const errData = await apiRes.json().catch(() => ({}));
      throw new Error(`Claude API エラー: ${errData.error?.message ?? apiRes.status}`);
    }

    const apiData = await apiRes.json();
    const rawText = apiData.content.map(i => i.text || '').join('');
    const jsonText = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonText);

    setResult(parsed);
    setStep(STEPS.RESULT);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // X データ取得
  // ──────────────────────────────────────────────────────────────────────────────
  const fetchFromX = async () => {
    setError('');
    setFetchLog([]);
    setStep(STEPS.FETCHING);

    const match = tweetUrl.match(/status\/(\d+)/);
    if (!match) {
      setError('URLが正しくありません。XのポストURLを入力してください。');
      setStep(STEPS.INPUT);
      return;
    }
    const tweetId = match[1];

    try {
      addLog('🔍 プロキシサーバーに接続中...');

      let repliesRes;
      try {
        repliesRes = await fetch(
          `${PROXY}/replies?tweet_id=${tweetId}&bearer_token=${encodeURIComponent(bearerToken)}&max_results=500`
        );
      } catch {
        throw new Error('PROXY_ERROR');
      }

      if (!repliesRes.ok) {
        const errData = await repliesRes.json().catch(() => ({}));
        throw new Error(errData.error || `リプライ取得失敗 (${repliesRes.status})`);
      }

      const data = await repliesRes.json();
      addLog(`✅ 元ポスト取得完了: @${data.originalAuthor?.username}`);
      addLog(`💬 リプライ取得数: ${data.replies?.length ?? 0}件 / 総件数: ${data.totalFetched ?? data.replies?.length ?? 0}件`);

      // 全ユーザーの投稿傾向取得
      const usersToFetch = data.users ?? [];
      const userContextMap = {};

      for (const user of usersToFetch) {
        try {
          addLog(`📊 @${user.username} の投稿履歴取得中...`);
          const ctxRes = await fetch(
            `${PROXY}/user-context?user_id=${user.id}&bearer_token=${encodeURIComponent(bearerToken)}`
          );
          if (ctxRes.ok) {
            const ctxData = await ctxRes.json();
            userContextMap[user.id] = ctxData.recentTweets ?? [];
          }
        } catch {
          // skip
        }
      }

      addLog('🤖 Claude AIによる分析を開始...');
      setStep(STEPS.ANALYZING);
      await analyze(data, userContextMap);

    } catch (err) {
      if (err.message === 'PROXY_ERROR') {
        setError('プロキシに接続できません。node x-proxy.js を実行してください。');
      } else {
        setError(err.message);
      }
      setStep(STEPS.INPUT);
    }
  };

  const resetToInput = () => {
    setResult(null);
    setError('');
    setFetchLog([]);
    setTweetUrl('');
    setStep(STEPS.INPUT);
  };

  const postText = result
    ? `🔍 この投稿への反応、分析してみた（${result.totalReplies ?? 0}件）

👍 賛同 ${result.supporters?.percentage ?? 0}% / 👎 批判 ${result.critics?.percentage ?? 0}% / 🤖 AI疑惑 ${result.aiAccounts?.percentage ?? 0}%

【賛同者像】${result.supporters?.title} ${(result.supporters?.tags ?? []).map(t => `#${t}`).join(' ')}
【批判者像】${result.critics?.title} ${(result.critics?.tags ?? []).map(t => `#${t}`).join(' ')}
💡 ${result.insight}
元ポスト: ${tweetUrl}
#コメント分析 #Xペルソナ分析`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(postText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // レンダリング
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.base}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── SETUP ─────────────────────────────────────────────────────────── */}
      {step === STEPS.SETUP && (
        <div style={S.card}>
          <div style={{ marginBottom: 28 }}>
            <div style={S.sectionLabel}>COMMENT PERSONA ANALYZER</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>初期設定</h1>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>X (Twitter) Bearer Token</label>
            <input
              type="password"
              value={bearerToken}
              onChange={e => setBearerToken(e.target.value)}
              placeholder="AAAAAAAAAAAAAAAAAAAAAA..."
              style={S.input}
            />
          </div>

          <div style={{ marginBottom: 26 }}>
            <label style={S.label}>Claude API Key</label>
            <input
              type="password"
              value={claudeApiKey}
              onChange={e => setClaudeApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              style={S.input}
            />
          </div>

          <button
            onClick={() => {
              if (bearerToken && claudeApiKey) {
                localStorage.setItem('x_bearer_token', bearerToken);
                localStorage.setItem('x_claude_api_key', claudeApiKey);
                setStep(STEPS.INPUT);
              }
            }}
            style={{
              ...S.primaryBtn,
              opacity: (!bearerToken || !claudeApiKey) ? 0.45 : 1,
              marginBottom: 32,
            }}
          >
            設定を保存して次へ
          </button>

          <div style={{
            background: '#13131f',
            border: '1px solid #2a2a3e',
            borderRadius: 10,
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7070a0', marginBottom: 16, letterSpacing: 1 }}>
              📋 Bearer Token 取得手順
            </div>
            {[
              'developer.twitter.com にアクセスしてログイン',
              '「Projects & Apps」から新規アプリを作成',
              '「Keys and Tokens」タブを開く',
              '「Bearer Token」を生成・コピー',
              'こちらのフォームに貼り付けて保存',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 4 ? 10 : 0 }}>
                <div style={{
                  flexShrink: 0,
                  width: 22, height: 22,
                  background: '#6366f120',
                  border: '1px solid #6366f144',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#6366f1',
                }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: '#9090b0', lineHeight: 1.55 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INPUT ─────────────────────────────────────────────────────────── */}
      {step === STEPS.INPUT && (
        <div style={S.card}>
          <div style={{ marginBottom: 24 }}>
            <div style={S.sectionLabel}>COMMENT PERSONA ANALYZER</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 14 }}>
              ポストURLを入力
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px #22c55e88',
                }} />
                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                  Bearer Token 設定済み
                </span>
              </div>
              <button
                onClick={() => setStep(STEPS.SETUP)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7070a0',
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                設定を変更
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#ff000018',
              border: '1px solid #ff000040',
              borderRadius: 8,
              padding: '12px 16px',
              color: '#ff7070',
              fontSize: 13,
              marginBottom: 18,
              lineHeight: 1.5,
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>XのポストURL</label>
            <input
              type="text"
              value={tweetUrl}
              onChange={e => setTweetUrl(e.target.value)}
              placeholder="https://x.com/username/status/1234567890123456789"
              style={S.input}
            />
          </div>

          <button
            onClick={fetchFromX}
            style={{ ...S.primaryBtn, opacity: !tweetUrl ? 0.45 : 1, marginBottom: 16 }}
          >
            取得→分析する
          </button>

          <div style={{
            background: '#1a1a0e',
            border: '1px solid #3a3a1e',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: '#aaaa55',
            lineHeight: 1.6,
          }}>
            ⚠️ 事前に{' '}
            <code style={{ background: '#2a2a14', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
              node x-proxy.js
            </code>
            {' '}を先に起動してください
          </div>
        </div>
      )}

      {/* ── FETCHING / ANALYZING ──────────────────────────────────────────── */}
      {(step === STEPS.FETCHING || step === STEPS.ANALYZING) && (
        <div style={{ ...S.card, textAlign: 'center', padding: '52px 32px' }}>
          <TripleSpinner />

          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            {step === STEPS.FETCHING ? 'データ取得中...' : 'AI分析中...'}
          </div>
          <div style={{ fontSize: 13, color: '#6060aa', marginBottom: 32 }}>
            {step === STEPS.FETCHING
              ? 'X APIからリプライを収集しています'
              : 'Claude AIがペルソナを分析しています'}
          </div>

          <div style={{
            background: '#13131f',
            borderRadius: 8,
            padding: '16px 20px',
            textAlign: 'left',
            maxHeight: 220,
            overflowY: 'auto',
          }}>
            {fetchLog.length === 0
              ? <div style={{ color: '#404060', fontSize: 12 }}>接続中...</div>
              : fetchLog.map((log, i) => (
                <div key={i} style={{
                  fontSize: 12,
                  lineHeight: 1.9,
                  color: i === fetchLog.length - 1 ? '#e0e0f0' : '#404060',
                }}>{log}</div>
              ))}
          </div>
        </div>
      )}

      {/* ── RESULT ────────────────────────────────────────────────────────── */}
      {step === STEPS.RESULT && result && (
        <>
          {/* 分析カード */}
          <div style={{ ...S.card, marginBottom: 20 }}>
            {/* ヘッダー */}
            <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #2a2a3e' }}>
              <div style={{ ...S.sectionLabel, marginBottom: 12 }}>COMMENT PERSONA ANALYSIS</div>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.45, color: '#ffffff', marginBottom: 10 }}>
                {result.postSummary}
              </div>
              <div style={{ fontSize: 11, color: '#404060', wordBreak: 'break-all' }}>{tweetUrl}</div>
            </div>

            {/* AIアカウント割合 */}
            {result.aiAccounts && (
              <div style={{
                background: '#13131f',
                border: '1px solid #3a2a4e',
                borderRadius: 10,
                padding: '16px 20px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: 1 }}>
                    🤖 AIっぽいアカウント
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#a855f7' }}>
                    {result.aiAccounts.percentage}%
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#8080a0', lineHeight: 1.65, marginBottom: 8 }}>
                  {result.aiAccounts.description}
                </p>
                {(result.aiAccounts.usernames ?? []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {result.aiAccounts.usernames.map((u, i) => (
                      <span key={i} style={{
                        background: '#a855f714',
                        color: '#a855f7',
                        border: '1px solid #a855f744',
                        borderRadius: 20,
                        padding: '2px 10px',
                        fontSize: 11,
                      }}>{u}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ペルソナパネル 2カラム */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <PersonaPanel
                persona={result.supporters}
                accent="#6366f1"
                label="賛同者像"
                emoji="👍"
              />
              <PersonaPanel
                persona={result.critics}
                accent="#ef4444"
                label="批判者像"
                emoji="👎"
              />
            </div>

            {/* インサイト */}
            <div style={{
              background: '#13131f',
              border: '1px solid #2a2a3e',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: 1, marginBottom: 8 }}>
                💡 INSIGHT
              </div>
              <p style={{ fontSize: 13, color: '#a0a0c0', lineHeight: 1.75 }}>{result.insight}</p>
            </div>

            {/* フッター */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#404060' }}>powered by Claude AI</span>
              <span style={{ fontSize: 11, color: '#404060' }}>#コメント分析 #Xペルソナ分析</span>
            </div>
          </div>

          {/* 投稿用テキストボックス */}
          <div style={{ ...S.card, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a0a0c0' }}>𝕏 投稿用テキスト</div>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? '#22c55e18' : '#6366f118',
                  border: `1px solid ${copied ? '#22c55e44' : '#6366f144'}`,
                  color: copied ? '#22c55e' : '#6366f1',
                  borderRadius: 6,
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ コピー済み' : 'コピー'}
              </button>
            </div>
            <pre style={{
              background: '#13131f',
              border: '1px solid #2a2a3e',
              borderRadius: 8,
              padding: '14px 16px',
              fontSize: 13,
              color: '#c0c0e0',
              lineHeight: 1.85,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>{postText}</pre>
          </div>

          {/* 戻るボタン */}
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <button
              onClick={resetToInput}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a3e',
                color: '#7070a0',
                borderRadius: 8,
                padding: '10px 22px',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              ← 別の投稿を分析
            </button>
          </div>
        </>
      )}
    </div>
  );
}
