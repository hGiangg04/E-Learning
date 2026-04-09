/**
 * Trích URL ảnh thật từ link Google Images / trang tìm kiếm (thường có tham số imgurl).
 * Hỗ trợ URL dài, encode nhiều lớp, hoặc chuỗi không parse được bằng `new URL`.
 */
function decodeRepeated(encoded) {
  let s = String(encoded).replace(/\+/g, ' ');
  for (let i = 0; i < 5; i++) {
    try {
      const next = decodeURIComponent(s);
      if (next === s) break;
      s = next;
    } catch {
      break;
    }
  }
  return s;
}

export function resolveDirectImageUrl(raw) {
  const s = String(raw || '').trim();
  if (!s || s.startsWith('data:')) return s;

  // Regex: imgurl thường là tham số đầu tiên hoặc giữa query — bắt mọi vị trí
  const imgurlParam = s.match(/(?:^|[?&])imgurl=([^&]+)/i);
  if (imgurlParam) {
    const decoded = decodeRepeated(imgurlParam[1]);
    if (/^https?:\/\//i.test(decoded)) return decoded;
  }

  try {
    const u = new URL(s);
    for (const key of ['imgurl', 'url', 'mediaurl']) {
      const v = u.searchParams.get(key);
      if (!v) continue;
      const decoded = decodeRepeated(v);
      if (/^https?:\/\//i.test(decoded)) return decoded;
    }
  } catch {
    /* bỏ qua */
  }

  return s;
}
