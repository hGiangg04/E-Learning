/**
 * Trả về URL embed YouTube (https://www.youtube.com/embed/VIDEO_ID) hoặc null.
 * Hỗ trợ: watch?v=, youtu.be, /embed/, /shorts/
 */
export function parseYouTubeEmbedUrl(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname.startsWith('/embed/')) {
        const id = u.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    return null;
  }

  return null;
}
