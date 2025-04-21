export interface URL {
  id: number;
  original_url: string;
  normalized_url: string;
  code: string;
  created_at: Date;
  updated_at: Date;
}

export type CreateURL = Omit<URL, 'id' | 'created_at' | 'updated_at'>;
export type UpdateURL = Partial<CreateURL>;

// Helper function to normalize URLs
export function normalizeURL(url: string): string {
  try {
    const urlObject = new URL(url);
    // Remove trailing slashes
    let normalized = urlObject.origin + urlObject.pathname.replace(/\/+$/, '');
    // Add query parameters if they exist
    if (urlObject.search) {
      normalized += urlObject.search;
    }
    // Add hash if it exists
    if (urlObject.hash) {
      normalized += urlObject.hash;
    }
    return normalized.toLowerCase();
  } catch (error) {
    throw new Error('Invalid URL provided');
  }
} 