const jwt = require('jsonwebtoken');
const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send({ error: 'Access Denied' });
    try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
    } catch (err) {
    res.status(400).send({ error: 'Invalid Token' });
    }
};
module.exports = authMiddleware;