import jwt from 'jsonwebtoken';
import env from '../config/env.js';

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export { signToken, verifyToken };
