// Saves the signed-in user's profile picture. Runs after requireAuth, so the update
// is made as that user and the database rules apply to them.
export const updateAvatar = async (req, res) => {
  try {
    const { avatar_url } = req.body;

    // Only allow a picture the user uploaded to their own folder, so nobody can point
    // their avatar at someone else's file
    const ownFolder = `/ProfilePictures/${req.user.id}/`;
    if (!avatar_url || !avatar_url.includes(ownFolder)) {
      return res.status(400).json({ error: "Avatar must be a picture you uploaded to your profile" });
    }

    const { data, error } = await req.supabase
      .from("profiles")
      .update({ avatar_url })
      .eq("id", req.user.id)
      .select("id");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Under the database rules an update that matches nothing is not an error, so check for it
    if (!data?.length) {
      return res.status(403).json({ error: "Could not update your profile picture" });
    }

    res.json({ avatar_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
