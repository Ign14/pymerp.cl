/**
 * Utility functions for handling YouTube video URLs and embeds
 */

export interface VideoInfo {
  videoId: string;
  embedUrl: string;
  isValid: boolean;
  error?: string;
}

/**
 * Extracts YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - VIDEO_ID (direct ID)
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  
  // If it's already just an ID (11 characters, alphanumeric, dashes, underscores)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Try to extract from iframe src
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/);
  if (iframeMatch) {
    return extractYouTubeVideoId(iframeMatch[1]);
  }

  return null;
}

/**
 * Validates and processes a YouTube URL or video ID
 * Returns video info with embed URL
 */
export function processYouTubeUrl(url: string): VideoInfo {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      videoId: '',
      embedUrl: '',
      isValid: false,
      error: 'URL vacía',
    };
  }

  const videoId = extractYouTubeVideoId(url.trim());

  if (!videoId) {
    return {
      videoId: '',
      embedUrl: '',
      isValid: false,
      error: 'URL de YouTube no válida. Acepta enlaces como: https://youtu.be/VIDEO_ID o https://www.youtube.com/watch?v=VIDEO_ID',
    };
  }

  // Build embed URL with privacy-enhanced mode
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  return {
    videoId,
    embedUrl,
    isValid: true,
  };
}

/**
 * Generates a thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualities = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    maxres: 'maxresdefault.jpg',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualities[quality]}`;
}

/**
 * Validates if a string is a valid YouTube URL or video ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  return processYouTubeUrl(url).isValid;
}

