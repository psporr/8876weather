/**
 * Open-Meteo API Client for Weather Forecast, Air Quality and Geocoding
 */

export const DEFAULT_LOCATION = {
  name: 'แกรนด์ พลีโน่ สุขสวัสดิ์-พระราม 3',
  district: 'ทุ่งครุ / บางมด',
  province: 'กรุงเทพมหานคร',
  latitude: 13.6361,
  longitude: 100.4934,
  isDefault: true
};

export const PRESET_LOCATIONS = [
  {
    name: 'แกรนด์ พลีโน่ สุขสวัสดิ์-พระราม 3',
    district: 'ทุ่งครุ / บางมด',
    province: 'กรุงเทพฯ',
    latitude: 13.6361,
    longitude: 100.4934
  },
  {
    name: 'แยกพระราม 3 - สะพานภูมิพล',
    district: 'ยานนาวา',
    province: 'กรุงเทพฯ',
    latitude: 13.6780,
    longitude: 100.5430
  },
  {
    name: 'ราษฎร์บูรณะ - สุขสวัสดิ์',
    district: 'ราษฎร์บูรณะ',
    province: 'กรุงเทพฯ',
    latitude: 13.6820,
    longitude: 100.5050
  },
  {
    name: 'พระประแดง',
    district: 'พระประแดง',
    province: 'สมุทรปราการ',
    latitude: 13.6580,
    longitude: 100.5330
  },
  {
    name: 'สยามสแควร์ - สาทร - สีลม',
    district: 'ปทุมวัน / บางรัก',
    province: 'กรุงเทพฯ',
    latitude: 13.7380,
    longitude: 100.5310
  },
  {
    name: 'บางนา - แบริ่ง',
    district: 'บางนา',
    province: 'กรุงเทพฯ',
    latitude: 13.6680,
    longitude: 100.6050
  },
  {
    name: 'จตุจักร - ลาดพร้าว',
    district: 'จตุจักร',
    province: 'กรุงเทพฯ',
    latitude: 13.8050,
    longitude: 100.5600
  }
];

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_API_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function fetchWeatherData(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'uv_index'
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'rain',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'uv_index',
      'is_day'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'uv_index_max',
      'wind_speed_10m_max',
      'sunrise',
      'sunset'
    ].join(','),
    timezone: 'Asia/Bangkok',
    forecast_days: 7
  });

  const url = `${WEATHER_API_URL}?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงข้อมูลสภาพอากาศได้ (HTTP ${response.status})`);
  }
  
  return await response.json();
}

export async function fetchAirQualityData(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'pm10,pm2_5,european_aqi,us_aqi',
      hourly: 'pm2_5,pm10,us_aqi',
      timezone: 'Asia/Bangkok',
      forecast_days: 2
    });

    const url = `${AIR_QUALITY_API_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('Air quality data fetch failed or unavailable:', err);
    return null;
  }
}

export async function searchLocations(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();
  const params = new URLSearchParams({
    name: cleanQuery,
    count: 8,
    language: 'th',
    format: 'json'
  });

  const url = `${GEOCODING_API_URL}?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  if (!data || !data.results) {
    return [];
  }

  return data.results.map(item => ({
    name: item.name,
    district: item.admin2 || item.admin3 || '',
    province: item.admin1 || item.country || '',
    country: item.country || 'ไทย',
    latitude: item.latitude,
    longitude: item.longitude,
    display: [item.name, item.admin1, item.country].filter(Boolean).join(', ')
  }));
}

export function saveLastLocation(location) {
  try {
    localStorage.setItem('gp_weather_last_location', JSON.stringify(location));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

export function getLastLocation() {
  try {
    const saved = localStorage.getItem('gp_weather_last_location');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return DEFAULT_LOCATION;
}
