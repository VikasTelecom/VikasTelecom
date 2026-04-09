const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

const googleAuth = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  let payload;
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google auth is not configured on server" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid Google credential" });
  }

  const {
    sub: googleId,
    email,
    email_verified: emailVerified,
    name,
    given_name: givenName,
  } = payload;

  if (!payload || !googleId || !email) {
    return res.status(401).json({ message: "Invalid Google credential payload" });
  }

  if (emailVerified === false) {
    return res.status(401).json({ message: "Google email is not verified" });
  }

  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email: email.toLowerCase() });
  }

  if (user && user.status === "blocked") {
    return res.status(403).json({ message: "Account is blocked" });
  }

  if (!user) {
    user = await User.create({
      name: name || givenName || "Google User",
      email,
      googleId,
      role: "user",
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (!user.name && (name || givenName)) {
      user.name = name || givenName;
    }
    await user.save();
  }

  const token = signToken(user);
  return res.json({ user: sanitizeUser(user), token });
};

module.exports = { googleAuth };
