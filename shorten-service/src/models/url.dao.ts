import db from '../config/database';
import { URL, CreateURL, UpdateURL } from './url';

export class URLDao {
  private static TABLE = 'urls';

  static async create(url: CreateURL): Promise<URL> {
    const [created] = await db(this.TABLE)
      .insert(url)
      .returning('*');
    return created;
  }

  static async findByCode(code: string): Promise<URL | null> {
    const url = await db(this.TABLE)
      .where({ code })
      .first();
    return url || null;
  }

  static async findByNormalizedURL(normalizedUrl: string): Promise<URL | null> {
    const url = await db(this.TABLE)
      .where({ normalized_url: normalizedUrl })
      .first();
    return url || null;
  }

  static async update(id: number, update: UpdateURL): Promise<URL | null> {
    const [updated] = await db(this.TABLE)
      .where({ id })
      .update({
        ...update,
        updated_at: db.fn.now()
      })
      .returning('*');
    return updated || null;
  }

  static async delete(id: number): Promise<boolean> {
    const deleted = await db(this.TABLE)
      .where({ id })
      .delete();
    return deleted > 0;
  }
} 