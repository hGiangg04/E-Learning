/**
 * Trích URL ảnh thật từ một số link Google (tham số `imgurl` / `url` trong query).
 * Nhiều trang tìm kiếm ảnh nhúng đường dẫn CDN trong query string.
 */
export function resolveDirectImageUrl(raw) {
  const s = String(raw || '').trim();
  if (!s || s.startsWith('data:')) return s;

  try {
    const u = new URL(s);
    const imgurl = u.searchParams.get('imgurl') || u.searchParams.get('url');
    if (imgurl) {
      let decoded = imgurl;
      try {
        decoded = decodeURIComponent(imgurl.replace(/\+/g, ' '));
      } catch {
        /* giữ nguyên */
      }
      if (/^https?:\/\//i.test(decoded)) return decoded;
    }
  } catch {
    return s;
  }

  return s;
}
