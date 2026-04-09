/**
 * Chuẩn hóa URL ảnh: link Google Images thường có tham số imgurl= chứa URL ảnh thật.
 * Trình duyệt không thể hiển thị trực tiếp trang google.com/imgres như một ảnh.
 */
export function resolveCourseImageUrl(input) {
  if (!input || typeof input !== 'string') return '';
  const s = input.trim();
  if (!s) return '';
  if (s.startsWith('data:')) return s;

  try {
    const u = new URL(s);
    const imgurl = u.searchParams.get('imgurl');
    if (imgurl) {
      return decodeURIComponent(imgurl);
    }
  } catch {
    /* URL tương đối hoặc không hợp lệ — thử regex bên dưới */
  }

  const m = s.match(/[?&]imgurl=([^&]+)/i);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }

  return s;
}
