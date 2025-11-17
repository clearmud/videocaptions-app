import { db } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { SubscriptionTier } from '../config/tiers.js';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name?: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  minutes_used_this_month: number;
  minutes_quota: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
}

export class UserModel {
  static async create(data: CreateUserData): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(data.email, passwordHash, data.name || null);

    return this.findById(Number(result.lastInsertRowid))!;
  }

  static findById(id: number): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static updateSubscription(
    userId: number,
    tier: SubscriptionTier,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): void {
    const stmt = db.prepare(`
      UPDATE users
      SET subscription_tier = ?,
          stripe_customer_id = ?,
          stripe_subscription_id = ?,
          subscription_status = 'active',
          minutes_quota = CASE
            WHEN ? = 'free' THEN 10
            WHEN ? = 'starter' THEN 90
            WHEN ? = 'pro' THEN 360
            ELSE 10
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(tier, stripeCustomerId || null, stripeSubscriptionId || null, tier, tier, tier, userId);
  }

  static incrementUsage(userId: number, minutes: number): void {
    const stmt = db.prepare(`
      UPDATE users
      SET minutes_used_this_month = minutes_used_this_month + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(minutes, userId);
  }

  static getRemainingMinutes(user: User): number {
    // Check credit packs first
    const creditPackStmt = db.prepare(`
      SELECT SUM(minutes_remaining) as total
      FROM credit_packs
      WHERE user_id = ?
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `);

    const creditPack = creditPackStmt.get(user.id) as { total: number | null };
    const creditMinutes = creditPack?.total || 0;

    // Calculate subscription minutes
    const subscriptionMinutes = Math.max(0, user.minutes_quota - user.minutes_used_this_month);

    return subscriptionMinutes + creditMinutes;
  }

  static canProcessVideo(user: User, videoDurationMinutes: number): boolean {
    const remaining = this.getRemainingMinutes(user);
    return remaining >= videoDurationMinutes;
  }

  static deductMinutes(userId: number, minutes: number): void {
    // First try to deduct from credit packs
    const creditPackStmt = db.prepare(`
      SELECT id, minutes_remaining
      FROM credit_packs
      WHERE user_id = ?
      AND minutes_remaining > 0
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY expires_at ASC NULLS LAST, id ASC
      LIMIT 1
    `);

    const creditPack = creditPackStmt.get(userId) as { id: number; minutes_remaining: number } | undefined;

    if (creditPack && creditPack.minutes_remaining >= minutes) {
      // Deduct from credit pack
      const updateStmt = db.prepare(`
        UPDATE credit_packs
        SET minutes_remaining = minutes_remaining - ?
        WHERE id = ?
      `);
      updateStmt.run(minutes, creditPack.id);
    } else if (creditPack && creditPack.minutes_remaining > 0) {
      // Partially deduct from credit pack, rest from subscription
      const remaining = minutes - creditPack.minutes_remaining;

      const updateCreditStmt = db.prepare(`
        UPDATE credit_packs
        SET minutes_remaining = 0
        WHERE id = ?
      `);
      updateCreditStmt.run(creditPack.id);

      this.incrementUsage(userId, remaining);
    } else {
      // Deduct from subscription quota
      this.incrementUsage(userId, minutes);
    }
  }

  static getUsageStats(userId: number) {
    const user = this.findById(userId);
    if (!user) return null;

    const videosStmt = db.prepare(`
      SELECT COUNT(*) as total_videos, SUM(minutes_consumed) as total_minutes
      FROM videos
      WHERE user_id = ?
    `);

    const stats = videosStmt.get(userId) as { total_videos: number; total_minutes: number };

    return {
      subscription_tier: user.subscription_tier,
      minutes_quota: user.minutes_quota,
      minutes_used_this_month: user.minutes_used_this_month,
      minutes_remaining: this.getRemainingMinutes(user),
      total_videos_processed: stats.total_videos || 0,
      total_minutes_processed: stats.total_minutes || 0,
    };
  }
}
