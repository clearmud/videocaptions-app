import { Request, Response } from 'express';
import { UserModel } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { validationResult } from 'express-validator';

export async function register(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name } = req.body;

  try {
    // Check if user already exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = await UserModel.create({ email, password, name });

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_tier: user.subscription_tier,
        minutes_remaining: UserModel.getRemainingMinutes(user),
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

export async function login(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = UserModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await UserModel.verifyPassword(user, password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_tier: user.subscription_tier,
        minutes_remaining: UserModel.getRemainingMinutes(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

export function getProfile(req: any, res: Response) {
  const user = req.user;

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_tier: user.subscription_tier,
      subscription_status: user.subscription_status,
      minutes_quota: user.minutes_quota,
      minutes_used_this_month: user.minutes_used_this_month,
      minutes_remaining: UserModel.getRemainingMinutes(user),
      created_at: user.created_at,
    },
  });
}

export function getUsageStats(req: any, res: Response) {
  const stats = UserModel.getUsageStats(req.user.id);

  if (!stats) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    stats,
  });
}
