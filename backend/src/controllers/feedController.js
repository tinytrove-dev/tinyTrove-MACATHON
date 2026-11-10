import { CHECKS_SELECT, summarizeChecks } from "./engagementController.js";

// Note: posts -> profiles must be written `profiles!user_id (...)`. post_checks
// and post_comments also link posts to profiles, so a bare `profiles (...)` is ambiguous.

// --- RANKING ---
// popularity = (validations * 1 + comments * 0.5 + 1) * 0.5 ^ (age / half-life)
//              * 0.5 ^ (recent sold-out reports), floored at 0.1, if its checks add
//                up to sold out (see summarizeChecks). While sold out, validations
//                don't count (they're out of date).
//              * 0.1 once enough people say it was never there.
// Signed-in users get that multiplied by (1 + boosts) for posts whose treasures
// match their communities or the posts they've engaged with / made.
// All the knobs are here so they're easy to tune.
const CANDIDATE_LIMIT = 300;      // most recent posts considered for ranking
const HALF_LIFE_HOURS = 72;       // a post's score halves every 3 days
const WEIGHTS = { validation: 1, comment: 0.5 };
const SOLD_OUT_PENALTY = 0.5;     // per recent sold-out report...
const SOLD_OUT_FLOOR = 0.1;       // ...but never below this: still useful history
const NOT_REAL_REPORTS = 2;       // this many "not real" reports sink a post to the floor
const BOOSTS = {
  community: 1.5,  // treasure belongs to one of your communities
  engagedTag: 1.0, // treasure appears on posts you checked or commented on
  postedTag: 0.5,  // treasure appears on your own posts
};

const MIGRATION_HINT =
  "Feed needs the post_checks/post_comments tables. Run backend/sql/001 and 002 in the Supabase SQL editor.";

const countOf = (embedded) => embedded?.[0]?.count ?? 0;

const tagIdsOf = (posts) =>
  (posts || []).flatMap((post) => (post?.post_tags || []).map((pt) => pt.tag_id));

// Collects the signals used to personalise the feed for `userId`
async function getUserSignals(db, userId) {
  const [memberships, myPosts, myChecks, myComments] = await Promise.all([
    db.from("community_members").select("community_id, communities ( name )").eq("user_id", userId),
    db.from("posts").select("post_tags ( tag_id )").eq("user_id", userId),
    db.from("post_checks").select("posts ( post_tags ( tag_id ) )").eq("user_id", userId),
    db.from("post_comments").select("posts ( post_tags ( tag_id ) )").eq("user_id", userId),
  ]);

  const error = memberships.error || myPosts.error || myChecks.error || myComments.error;
  if (error) throw error;

  // treasure id -> name of the user's community it belongs to
  const communityByTag = new Map();
  const communityIds = (memberships.data || []).map((m) => m.community_id);
  if (communityIds.length > 0) {
    const { data: links, error: linkError } = await db
      .from("community_treasures")
      .select("community_id, treasure_id")
      .in("community_id", communityIds);
    if (linkError) throw linkError;

    const nameById = new Map(
      (memberships.data || []).map((m) => [m.community_id, m.communities?.name])
    );
    for (const link of links || []) {
      communityByTag.set(link.treasure_id, nameById.get(link.community_id));
    }
  }

  return {
    communityByTag,
    postedTags: new Set(tagIdsOf(myPosts.data)),
    engagedTags: new Set([
      ...tagIdsOf((myChecks.data || []).map((c) => c.posts)),
      ...tagIdsOf((myComments.data || []).map((c) => c.posts)),
    ]),
  };
}

// GET /api/feed?limit=20&offset=0
// Guests get the popular feed; signed-in users get it personalised.
export const getFeed = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const db = req.supabase;
    const userId = req.user?.id;

    const [postsResult, signals] = await Promise.all([
      db
        .from("posts")
        .select(`
          id, user_id, caption, photo_url, location, created_at,
          profiles!user_id ( username, display_name, avatar_url ),
          post_tags ( tag_id, treasure_tag ( name ) ),
          ${CHECKS_SELECT},
          post_comments ( count )
        `)
        .order("created_at", { ascending: false })
        .limit(CANDIDATE_LIMIT),
      userId ? getUserSignals(db, userId) : null,
    ]);

    if (postsResult.error) {
      const missingTables = /post_checks|post_comments/.test(postsResult.error.message);
      return res.status(missingTables ? 500 : 400).json({
        error: missingTables ? MIGRATION_HINT : postsResult.error.message,
      });
    }

    const now = Date.now();

    const ranked = (postsResult.data || [])
      .map((post) => {
        const checks = summarizeChecks(post.post_checks, userId);
        const comments = countOf(post.post_comments);
        const tagIds = (post.post_tags || []).map((pt) => pt.tag_id);

        const ageHours = Math.max(now - new Date(post.created_at).getTime(), 0) / 36e5;
        // While sold out, earlier validations ("it's in stock") are outdated, so they
        // don't lift the score; they count again once someone validates it again
        const isSoldOut = checks.stock_status === "sold_out";
        const validations = isSoldOut ? 0 : checks.validation_count;
        const engagement = validations * WEIGHTS.validation + comments * WEIGHTS.comment;
        let score = (engagement + 1) * Math.pow(0.5, ageHours / HALF_LIFE_HOURS);
        if (isSoldOut) {
          // Old reports with no recent ones still count as one
          const reports = Math.max(checks.recent_sold_out_count, 1);
          score *= Math.max(Math.pow(SOLD_OUT_PENALTY, reports), SOLD_OUT_FLOOR);
        }
        if (checks.not_real_count >= NOT_REAL_REPORTS) score *= SOLD_OUT_FLOOR;

        // Personal boosts (never applied to the user's own posts)
        let reason = null;
        if (signals && post.user_id !== userId) {
          const communityTag = tagIds.find((id) => signals.communityByTag.has(id));
          const hasEngagedTag = tagIds.some((id) => signals.engagedTags.has(id));
          const hasPostedTag = tagIds.some((id) => signals.postedTags.has(id));

          score *=
            1 +
            (communityTag ? BOOSTS.community : 0) +
            (hasEngagedTag ? BOOSTS.engagedTag : 0) +
            (hasPostedTag ? BOOSTS.postedTag : 0);

          if (communityTag) reason = `From ${signals.communityByTag.get(communityTag)}`;
          else if (hasEngagedTag || hasPostedTag) reason = "Similar to finds you like";
        }

        return {
          id: post.id,
          user_id: post.user_id,
          caption: post.caption,
          photo_url: post.photo_url,
          location: post.location,
          created_at: post.created_at,
          profiles: post.profiles,
          tags: (post.post_tags || []).map((pt) => pt.treasure_tag?.name).filter(Boolean),
          ...checks,
          comment_count: comments,
          reason,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    res.json({
      mode: userId ? "personalized" : "popular",
      items: ranked.slice(offset, offset + limit),
      has_more: offset + limit < ranked.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
