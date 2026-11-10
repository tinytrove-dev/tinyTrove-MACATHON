import { CHECKS_SELECT, summarizeChecks } from "./engagementController.js";

import { geocode } from "../lib/geocode.js";

const cleanId = (id, prefix) => String(id).replace(new RegExp(`^${prefix}-`), "");

// --- SEARCH ---
// Returns communities, stores and treasures matching ?q= (everything when empty)
export const search = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    // Strip characters that have meaning in PostgREST filter strings
    const pattern = `%${query.replace(/[%,()*\\]/g, "")}%`;

    const communityQuery = req.supabase
      .from("communities")
      .select("id,name,description,photo_url,banner_url,theme_color,number_of_members");
    const storeQuery = req.supabase
      .from("stores")
      .select("id,name,address");
    const treasureQuery = req.supabase
      .from("treasure_tag")
      .select("id,name,descriptor,photo");
    const communityTreasuresQuery = req.supabase
      .from("community_treasures")
      .select("community_id");

    if (query) {
      communityQuery.or(`name.ilike.${pattern},description.ilike.${pattern}`);
      storeQuery.or(`name.ilike.${pattern},address.ilike.${pattern}`);
      treasureQuery.ilike("name", pattern);
    }

    const [communities, stores, treasures, communityTreasures] = await Promise.all([
      communityQuery,
      storeQuery,
      treasureQuery,
      communityTreasuresQuery,
    ]);

    const error =
      communities.error || stores.error || treasures.error || communityTreasures.error;
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const treasureCountByCommunity = (communityTreasures.data || []).reduce((acc, row) => {
      acc[row.community_id] = (acc[row.community_id] || 0) + 1;
      return acc;
    }, {});

    res.json({
      communities: (communities.data || []).map((community) => ({
        ...community,
        treasures: treasureCountByCommunity[community.id] || 0,
      })),
      stores: stores.data || [],
      treasures: treasures.data || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- POSTS ---
export const getPost = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("posts")
      .select(`
        id,
        user_id,
        caption,
        location,
        photo_url,
        stores ( name, address ),
        profiles!user_id ( username, display_name, avatar_url ),
        post_tags (
          treasure_tag (
            name
          )
        ),
        ${CHECKS_SELECT},
        post_comments ( count )
      `)
      .eq("id", req.params.postId)
      .single();

    if (error) {
      return res.status(404).json({ error: error.message });
    }

    const { post_checks, post_comments, ...post } = data;
    res.json({
      ...post,
      ...summarizeChecks(post_checks, req.user?.id),
      comment_count: post_comments?.[0]?.count ?? 0,
      is_mine: req.user?.id === data.user_id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- TREASURES ---
export const getTreasures = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("treasure_tag")
      .select("id,name,photo");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTreasurePosts = async (req, res) => {
  try {
    const treasureId = cleanId(req.params.treasureId, "treasure");

    const { data: postTags, error } = await req.supabase
      .from("post_tags")
      .select("post_id")
      .eq("tag_id", treasureId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const postIds = postTags.map((pt) => pt.post_id);
    if (postIds.length === 0) {
      return res.json([]);
    }

    const { data: postsData, error: postsError } = await req.supabase
      .from("posts")
      .select("id, photo_url, location")
      .in("id", postIds);

    if (postsError) {
      return res.status(400).json({ error: postsError.message });
    }

    res.json(postsData || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTreasureCommunity = async (req, res) => {
  try {
    const treasureId = cleanId(req.params.treasureId, "treasure");

    const { data, error } = await req.supabase
      .from("community_treasures")
      .select(`
        communities (
          name,
          photo_url
        )
      `)
      .eq("treasure_id", treasureId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data?.communities || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- COMMUNITIES ---
// Treasures linked to a community, and posts tagged with any of them
export const getCommunityContent = async (req, res) => {
  try {
    const communityId = cleanId(req.params.communityId, "community");

    const { data: communityTreasures, error: communityTreasuresError } = await req.supabase
      .from("community_treasures")
      .select("treasure_id")
      .eq("community_id", communityId);

    if (communityTreasuresError) {
      return res.status(400).json({ error: communityTreasuresError.message });
    }

    const treasureIds = (communityTreasures || []).map((row) => row.treasure_id);
    if (treasureIds.length === 0) {
      return res.json({ treasures: [], posts: [] });
    }

    const [treasureResult, postTagsResult] = await Promise.all([
      req.supabase.from("treasure_tag").select("id,name,descriptor,photo").in("id", treasureIds),
      req.supabase.from("post_tags").select("post_id").in("tag_id", treasureIds),
    ]);

    const error = treasureResult.error || postTagsResult.error;
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const postIds = [...new Set((postTagsResult.data || []).map((row) => row.post_id))];
    let posts = [];
    if (postIds.length > 0) {
      const { data: postsData, error: postsError } = await req.supabase
        .from("posts")
        .select("id,photo_url")
        .in("id", postIds);

      if (postsError) {
        return res.status(400).json({ error: postsError.message });
      }
      posts = postsData || [];
    }

    res.json({ treasures: treasureResult.data || [], posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- STORES ---
export const getStores = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("stores")
      .select("id,name,address");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Geocodes the store name to an address and location, then saves it
export const createStore = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({ error: "Store name is required" });
    }

    const place = await geocode(name);

    const { data, error } = await req.supabase
      .from("stores")
      .insert([
        {
          name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
          address: place?.address || name,
          lat: place?.lat ?? null,
          lng: place?.lng ?? null,
          radius_m: place?.radius_m,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
