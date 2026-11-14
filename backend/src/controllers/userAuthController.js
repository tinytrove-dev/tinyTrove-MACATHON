import { supabase, createAuthClient } from "../UserAuth.js";

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({ user: data.user, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const signUp = async (req, res) => {
  try {
    const { email, password, username, displayName } = req.body;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile
    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          username: username.toLowerCase(),
          display_name: displayName,
          avatar_url: "",
        },
      ]);

      if (profileError) {
        return res.status(400).json({ error: profileError.message });
      }
    }

    res.json({ user: authData.user, message: "Sign up successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const signOut = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Signed out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch Profile Info
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      return res.status(404).json({ error: profileError.message });
    }

    res.json(profileData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch User's Posts with linked Store and Tag data
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        stores ( name, address ),
        post_tags ( 
          treasure_tag ( name ) 
        ) 
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postsError) {
      return res.status(404).json({ error: postsError.message });
    }

    res.json(postsData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserCommunities = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: membershipData, error: membershipError } = await supabase
      .from('community_members')
      .select(`
        communities (*
          , creator:profiles (
              display_name,
              avatar_url
            )
        )
      `)
      .eq('user_id', userId);

    if (membershipError) {
      return res.status(404).json({ error: membershipError.message });
    }

    // CRITICAL: Extract the 'communities' object so the frontend sees '.id'
    // Instead of [{ communities: { id: 1 } }], it becomes [{ id: 1 }]
    const flattenedCommunities = membershipData.map(item => item.communities);

    res.json(flattenedCommunities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const isMember = async (req, res) => {
  try {
    const { userId, communityId } = req.params;

    const { data, error } = await supabase
      .from("community_members")
      .select('role') // Join to get member info
      .eq("user_id", userId)
      .eq("community_id", communityId);

    if (error) {
      return res.status(404).json({ error: error.message });
    }

    res.json({ isMember: data.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- JOIN COMMUNITY ---
export const joinCommunity = async (req, res) => {
  try {
    const { userId, communityId } = req.body;

    if (!userId || !communityId) {
      return res.status(400).json({ error: "User ID and Community ID are required" });
    }

    // 1. Insert the membership record
    const { data: joinData, error: joinError } = await supabase
      .from("community_members")
      .insert([{ user_id: userId, community_id: communityId }])
      .select()
      .single();

    if (joinError) {
      if (joinError.code === '23505') {
        return res.status(400).json({ error: "You are already a member." });
      }
      return res.status(400).json({ error: joinError.message });
    }

    // 2. Increment the member count in the communities table
    // We use .rpc() here because it's atomic (prevents "race conditions")
    const { error: updateError } = await supabase.rpc('increment_community_members', { 
      comm_id: communityId 
    });

    if (updateError) {
      console.error("Member joined, but count failed to update:", updateError);
    }

    res.json({ message: "Successfully joined!", data: joinData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- LEAVE COMMUNITY ---
export const leaveCommunity = async (req, res) => {
  try {
    const { userId, communityId } = req.body;

    if (!userId || !communityId) {
      return res.status(400).json({ error: "User ID and Community ID are required" });
    }

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("user_id", userId)
      .eq("community_id", communityId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Successfully left the community" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};