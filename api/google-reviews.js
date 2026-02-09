export default async function handler(req, res) {
  try {
    const PLACE_ID = process.env.GOOGLE_PLACE_ID;
    const KEY = process.env.GOOGLE_PLACES_API_KEY;

    if (!PLACE_ID || !KEY) {
      return res.status(500).json({ error: "Missing GOOGLE_PLACE_ID or GOOGLE_PLACES_API_KEY" });
    }

    const fields = "rating,user_ratings_total,reviews";
    const url =
      "https://maps.googleapis.com/maps/api/place/details/json" +
      `?place_id=${encodeURIComponent(PLACE_ID)}` +
      `&fields=${encodeURIComponent(fields)}` +
      `&key=${encodeURIComponent(KEY)}`;

    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok || data.status !== "OK") {
      return res.status(502).json({ error: "Google Places error", details: data });
    }

    const result = data.result || {};
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");

    return res.status(200).json({
      rating: result.rating || 0,
      user_ratings_total: result.user_ratings_total || 0,
      reviews: (result.reviews || []).map(r => ({
        author_name: r.author_name,
        rating: r.rating,
        relative_time_description: r.relative_time_description,
        text: r.text
      }))
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}
