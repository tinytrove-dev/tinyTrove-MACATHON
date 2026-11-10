// Storage buckets the app is allowed to upload into
const UPLOAD_BUCKETS = ["Posts", "ProfilePictures"];

export const createPost = async (req, res) => {
  try {
    // 1. Extract the incoming data
    const { image, description, location, tags } = req.body;
    const userId = req.user.id;
    const normalizedTags = Array.isArray(tags)
      ? tags.filter((tag) => tag?.id)
      : [];

    if (normalizedTags.length === 0) {
      return res.status(400).json({ error: "At least one tag is required" });
    }

    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }

    // 2. Link the post to its store (location is the store's name), so checks can
    // tell whether someone is actually there
    const { data: store, error: storeError } = await req.supabase
      .from("stores")
      .select("id")
      .ilike("name", String(location))
      .limit(1)
      .maybeSingle();

    if (storeError) console.error("Store lookup failed:", storeError);

    // 3. Insert into the database
    const { data: postData, error: postError } = await req.supabase
      .from("posts")
      .insert([
        {
          user_id: userId,
          photo_url: image,
          caption: description,
          location: location,
          store_id: store?.id ?? null,
          // The current schema still expects a single treasure_tag FK on posts.
          treasure_tag: normalizedTags[0].id,
        },
      ])
      .select();

    // 4. Check for database errors specific to THIS query
    if (postError) {
      console.error("Database Error:", postError);
      return res.status(400).json({ error: postError.message });
    }

    const tagRows = normalizedTags.map((tag) => ({
      post_id: postData[0].id,
      tag_id: tag.id,
    }));

    const { error: tagError } = await req.supabase
      .from("post_tags")
      .insert(tagRows);

    if (tagError) throw tagError;

    // 5. Send the newly created post data back to the app
    res.status(201).json(postData);

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
};
export const createCommunity = async (req, res) => {
  try {
    // 1. Extract the incoming data
    const {
      name,
      description,
      photo_url,
      banner_url,
      tags,
      theme_color
    } = req.body;
    const userId = req.user.id;

    // 2. Safety check: need a Name
    if (!name) {
      return res.status(400).json({ error: "Community Name is required" });
    }

    // 3. STEP ONE: Create the Community (with safe null fallbacks)
    const { data: communityData, error: communityError } = await req.supabase
      .from("communities")
      .insert([
        {
          creator_id: userId,
          name: name,
          description: description || null,
          photo_url: photo_url || null,
          banner_url: banner_url || null,
          tags: tags && tags.length > 0 ? tags : null,
          theme_color: theme_color || null,
          number_of_members: 1 // Start at 1 because the creator is about to join!
        },
      ])
      .select();

    // Check if community creation failed
    if (communityError) {
      console.error("Database Error (Community):", communityError);
      return res.status(400).json({ error: communityError.message });
    }

    const newCommunity = communityData[0];

    // 4. STEP TWO: Auto-Join the Creator
    // We use the ID of the community we just created above!
    const { error: memberError } = await req.supabase
      .from("community_members")
      .insert([
        {
          community_id: newCommunity.id,
          user_id: userId,
          // 'joined_at' will be set automatically by Supabase defaults
        }
      ]);

    if (memberError) {
      // We log this, but we don't crash the server because the community WAS created successfully.
      console.error("Failed to auto-join creator to community:", memberError);
    } else {
      console.log(`Successfully created '${name}' and added creator!`);
    }

    // 5. Send the new community back to the mobile app
    res.status(201).json(newCommunity);

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const createTag = async (req, res) => {
  try {
    const { name, description, photo_url, communityId } = req.body;

    if (!name || !communityId) {
      return res.status(400).json({ error: "Name and Community ID are required" });
    }

    // 1. Create the Tag in the master list
    const { data: tagData, error: tagError } = await req.supabase
      .from("treasure_tag")
      .insert([{ name, descriptor: description || null, photo: photo_url || null }])
      .select();

    if (tagError) return res.status(400).json({ error: tagError.message });

    const newTagId = tagData[0].id;

    // 2. CRITICAL: Link this tag to the specific community
    const { error: linkError } = await req.supabase
      .from("community_treasures")
      .insert([{
        community_id: String(communityId).replace(/^community-/, ""), // Ensure clean ID
        treasure_id: newTagId
      }]);

    if (linkError) {
      console.error("Failed to link tag to community:", linkError);
    }

    res.status(201).json(tagData[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Accepts a base64 JPEG, stores it under the user's folder, returns its public URL
export const uploadImage = async (req, res) => {
  try {
    const { bucket, base64 } = req.body;

    if (!UPLOAD_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `bucket must be one of: ${UPLOAD_BUCKETS.join(", ")}` });
    }

    if (!base64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const filePath = `${req.user.id}/${Date.now()}.jpg`;

    const { error } = await req.supabase.storage
      .from(bucket)
      .upload(filePath, Buffer.from(base64, "base64"), { contentType: "image/jpeg" });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { data } = req.supabase.storage.from(bucket).getPublicUrl(filePath);

    res.status(201).json({ url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
