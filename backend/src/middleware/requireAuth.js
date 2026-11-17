import { supabase, supabaseForToken } from "../UserAuth.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

// Checks the Supabase access token in the Authorization header.
// On success sets:
//   req.user     - the signed-in Supabase user
//   req.supabase - a Supabase client acting as that user, so storage and database rules apply to them
export const requireAuth = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "Not signed in" });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }

    req.user = data.user;
    req.supabase = supabaseForToken(token);
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
