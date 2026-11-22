import { supabase, supabaseForToken } from "../UserAuth.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

// Verifies the Supabase access token in the Authorization header.
// On success sets:
//   req.user     - the authenticated Supabase user
//   req.token    - the raw access token
//   req.supabase - a Supabase client acting as that user
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
    req.token = token;
    req.supabase = supabaseForToken(token);
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// For routes guests can use too. With no token, continues as a guest:
// req.user is null and req.supabase is the anonymous client.
// A token that is present but invalid still gets a 401, so the app can refresh it.
export const optionalAuth = (req, res, next) => {
  if (!getBearerToken(req)) {
    req.user = null;
    req.supabase = supabase;
    return next();
  }
  return requireAuth(req, res, next);
};
