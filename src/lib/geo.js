// src/lib/geo.js
// 使用免費的 ip-api.com（每分鐘 45 次，無需 API key）

export async function getIpInfo() {
  try {
    const res = await fetch('https://ip-api.com/json/?fields=status,city,regionName,country,query&lang=zh-TW');
    const data = await res.json();
    if (data.status === 'success') {
      return {
        ip: data.query,
        location: {
          city: data.city || '未知城市',
          region: data.regionName || '未知地區',
          country: data.country || '未知國家',
        }
      };
    }
  } catch (e) {
    console.warn('IP 查詢失敗', e);
  }
  return {
    ip: 'unknown',
    location: { city: '未知', region: '未知', country: '未知' }
  };
}
