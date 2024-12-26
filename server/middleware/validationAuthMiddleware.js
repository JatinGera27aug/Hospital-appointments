const validateAuthInput = (req, res, next) => {
  const { username, email, password } = req.body;

  if (req.path.includes("register") && (!username || username.trim().length < 3)) {
    return res.status(400).json({ message: "Username must be at least 3 characters long" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!password || password.trim().length < 4) {
    return res.status(400).json({ message: "Password must be at least 4 characters long" });
  }

  next();
};

module.exports = validateAuthInput;

