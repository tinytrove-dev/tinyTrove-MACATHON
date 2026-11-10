const MAX_COMMENT_LENGTH = 500;
const CHECK_STATUSES = ["validated", "sold_out", "not_real"];
const RECENT_DAYS = 7; // sold-out reports newer than this count as "recent"

// --- STOCK STATUS ---
// Each user's current check is a vote that fades with age:
//   score = sum of direction * 0.5 ^ (age / half-life)
// validated pushes towards in stock (+1); sold_out and not_real towards gone (-1).
// Gone-claims fade slower: stock runs out by itself, it rarely comes back by itself.
// Above +threshold shows as validated, below -threshold as sold out, and anything in
// between is unconfirmed (null) - one contrary report can't flip a confirmed post,
// and posts nobody has checked lately drift back to unconfirmed.
const DIRECTION = { validated: 1, sold_out: -1, not_real: -1 };
const HALF_LIFE_HOURS = { validated: 24, sold_out: 72, not_real: 72 };
const STATUS_THRESHOLD = 0.5;

// --- CHECK RULES ---
const MAX_ACCURACY_SLACK_M = 100; // poor GPS can stretch the store's radius by up to this
const COOLDOWN_HOURS = 3;
const MAX_CHANGES_PER_COOLDOWN = 2; // a check plus one correction

// Embed this from `posts` to get what summarizeChecks needs
export const CHECKS_SELECT = "post_checks ( user_id, status, updated_at )";

// Turns a post's checks into what the app displays:
//   validation_count / sold_out_count / not_real_count - how many people currently say each
//   recent_sold_out_count - sold-out reports from the last RECENT_DAYS days
//   stock_status     - "validated" | "sold_out" | null (unconfirmed), from the fading score
//   stock_updated_at - when the latest check agreeing with stock_status happened
//   my_status        - the viewer's own check, if any
export const summarizeChecks = (checks = [], userId = null) => {
  const now = Date.now();
  const recentCutoff = new Date(now - RECENT_DAYS * 864e5).toISOString();
  const counts = { validated: 0, sold_out: 0, not_real: 0 };
  let recentSoldOutCount = 0;
  let score = 0;
  let myStatus = null;

  for (const check of checks) {
    counts[check.status]++;
    if (check.status === "sold_out" && check.updated_at > recentCutoff) recentSoldOutCount++;
    if (userId && check.user_id === userId) myStatus = check.status;

    const ageHours = Math.max(now - new Date(check.updated_at).getTime(), 0) / 36e5;
    score += DIRECTION[check.status] * Math.pow(0.5, ageHours / HALF_LIFE_HOURS[check.status]);
  }

  const stockStatus =
    score >= STATUS_THRESHOLD ? "validated" : score <= -STATUS_THRESHOLD ? "sold_out" : null;
  let stockUpdatedAt = null;
  if (stockStatus) {
    const sign = DIRECTION[stockStatus];
    for (const check of checks) {
      if (DIRECTION[check.status] === sign && (!stockUpdatedAt || check.updated_at > stockUpdatedAt)) {
        stockUpdatedAt = check.updated_at;
      }
    }
  }

  return {
    validation_count: counts.validated,
    sold_out_count: counts.sold_out,
    not_real_count: counts.not_real,
    recent_sold_out_count: recentSoldOutCount,
    stock_status: stockStatus,
    stock_updated_at: stockUpdatedAt,
    my_status: myStatus,
  };
};

const getCheckSummary = async (db, postId, userId) => {
  const { data, error } = await db
    .from("post_checks")
    .select("user_id, status, updated_at")
    .eq("post_id", postId);
  if (error) throw error;
  return summarizeChecks(data, userId);
};

// Great-circle distance in metres
const distanceMetres = (lat1, lng1, lat2, lng2) => {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371e3 * Math.asin(Math.sqrt(a));
};

// --- CHECKS ---
// PUT { status: "validated" | "sold_out" | "not_real", lat, lng, accuracy }.
// Replaces the user's previous check on this post. Anyone can report sold out; only
// other people can validate or say it's not real. You have to be at the store (when
// its location is known), and can change your check at most MAX_CHANGES_PER_COOLDOWN
// times every COOLDOWN_HOURS.
export const setCheck = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;
    const lat = req.body.lat == null ? NaN : Number(req.body.lat);
    const lng = req.body.lng == null ? NaN : Number(req.body.lng);
    const accuracy = Number(req.body.accuracy) || 0;

    if (!CHECK_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${CHECK_STATUSES.join(", ")}` });
    }

    const { data: post, error: postError } = await req.supabase
      .from("posts")
      .select("user_id, stores ( lat, lng, radius_m )")
      .eq("id", postId)
      .maybeSingle();

    if (postError) return res.status(400).json({ error: postError.message });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (status !== "sold_out" && post.user_id === req.user.id) {
      return res.status(400).json({ error: "You can only mark your own post as sold out" });
    }

    // Distance stays null when the store's location isn't known, so it can't be checked
    let distance = null;
    const store = post.stores;
    if (store?.lat != null && store?.lng != null) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ error: "Turn on location to check this post" });
      }
      distance = Math.round(distanceMetres(lat, lng, store.lat, store.lng));
      const slack = Math.min(Math.max(accuracy, 0), MAX_ACCURACY_SLACK_M);
      if (distance - slack > store.radius_m) {
        const away = distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`;
        return res.status(403).json({ error: `You need to be at the store to check this post (you're ${away} away)` });
      }
    }

    // Re-sending your current status is a no-op, so it can't refresh its age
    const { data: current, error: currentError } = await req.supabase
      .from("post_checks")
      .select("status")
      .eq("post_id", postId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (currentError) return res.status(400).json({ error: currentError.message });
    if (current?.status === status) {
      return res.json(await getCheckSummary(req.supabase, postId, req.user.id));
    }

    const { count: recentChanges, error: eventsError } = await req.supabase
      .from("post_check_events")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("user_id", req.user.id)
      .gte("created_at", new Date(Date.now() - COOLDOWN_HOURS * 36e5).toISOString());

    if (eventsError) return res.status(400).json({ error: eventsError.message });
    if (recentChanges >= MAX_CHANGES_PER_COOLDOWN) {
      return res.status(429).json({ error: "You've already changed your check on this post. Try again in a few hours." });
    }

    const { error } = await req.supabase
      .from("post_checks")
      .upsert(
        [{ post_id: postId, user_id: req.user.id, status, updated_at: new Date().toISOString() }],
        { onConflict: "post_id,user_id" }
      );

    if (error) return res.status(400).json({ error: error.message });

    const { error: logError } = await req.supabase
      .from("post_check_events")
      .insert([{ post_id: postId, user_id: req.user.id, status, distance_m: distance }]);

    if (logError) console.error("Failed to log check event:", logError);

    res.json(await getCheckSummary(req.supabase, postId, req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const clearCheck = async (req, res) => {
  try {
    const { postId } = req.params;

    const { error } = await req.supabase
      .from("post_checks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    res.json(await getCheckSummary(req.supabase, postId, req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- COMMENTS ---
export const getComments = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("post_comments")
      .select("id, body, created_at, user_id, profiles ( username, display_name, avatar_url )")
      .eq("post_id", req.params.postId)
      .order("created_at", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const body = String(req.body.body || "").trim();

    if (!body) {
      return res.status(400).json({ error: "Comment can't be empty" });
    }
    if (body.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Comments are limited to ${MAX_COMMENT_LENGTH} characters` });
    }

    const { data, error } = await req.supabase
      .from("post_comments")
      .insert([{ post_id: req.params.postId, user_id: req.user.id, body }])
      .select("id, body, created_at, user_id, profiles ( username, display_name, avatar_url )")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
