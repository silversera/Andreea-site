export default async function handler(req, res) {
  try {
    const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
    const USER_ID = process.env.IG_USER_ID;

    if (!ACCESS_TOKEN || !USER_ID) {
      return res.status(200).json({
        reels: [],
        note: "Missing IG_ACCESS_TOKEN or IG_USER_ID"
      });
    }

    // Fetch recent media from Instagram Graph API
    const url =
      `https://graph.instagram.com/${encodeURIComponent(USER_ID)}/media` +
      `?fields=id,media_type,permalink,timestamp` +
      `&access_token=${encodeURIComponent(ACCESS_TOKEN)}` +
      `&limit=50`;

    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok || data?.error) {
      return res.status(502).json({ error: "Instagram Graph API error", details: data });
    }

    const items = Array.isArray(data.data) ? data.data : [];

    // Filter to reels (permalink contains /reel/) and sort newest first
    const reels = items
      .filter(m => typeof m?.permalink === "string" && m.permalink.includes("instagram.com/reel/"))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 12)
      .map(m => (m.permalink.endsWith("/") ? m.permalink : m.permalink + "/"));

    // Cache 15 min to reduce API calls
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).json({ reels });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}
