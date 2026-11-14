// Buckets the app is allowed to upload into
const UPLOAD_BUCKETS = ["Posts", "ProfilePictures"];

// Stores a base64 image as the signed-in user and returns its public URL.
// Runs after requireAuth, so req.user and req.supabase are set.
export const uploadImage = async (req, res) => {
  try {
    const { bucket, base64 } = req.body;

    if (!UPLOAD_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `bucket must be one of: ${UPLOAD_BUCKETS.join(", ")}` });
    }

    if (!base64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Each user's files go in their own folder
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
