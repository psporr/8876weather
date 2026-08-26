/**
 * Simplified & Friendly Laundry Advisor Engine
 * Designed for everyday ease of use - answers "Can I wash and hang clothes today?" directly.
 */

export const FABRIC_TYPES = {
  normal: { label: '👕 เสื้อผ้าทั่วไป / เสื้อยืด', multiplier: 1.0, baseHours: 2.5 },
  heavy: { label: '👖 ผ้ายีนส์ / เสื้อหนา', multiplier: 1.6, baseHours: 4.0 },
  bedding: { label: '🛏️ ผ้าปูที่นอน / ผ้านวม', multiplier: 2.0, baseHours: 5.5 }
};

export function calculateLaundryAdvisor(weatherData, airQualityData = null, fabricType = 'normal') {
  if (!weatherData || !weatherData.current || !weatherData.hourly) {
    return null;
  }

  const current = weatherData.current;
  const hourly = weatherData.hourly;
  const currentHourIndex = findCurrentHourIndex(hourly.time, current.time);
  
  // Extract next 6 hours forecast window starting from CURRENT hour
  const windowHours = 6;
  const forecastWindow = [];
  
  for (let i = 0; i < windowHours; i++) {
    const idx = currentHourIndex + i;
    if (idx < hourly.time.length) {
      forecastWindow.push({
        time: hourly.time[idx],
        pop: hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0,
        rain: hourly.precipitation ? hourly.precipitation[idx] : 0,
        uv: hourly.uv_index ? hourly.uv_index[idx] : 0,
        humidity: hourly.relative_humidity_2m ? hourly.relative_humidity_2m[idx] : 60,
        temp: hourly.temperature_2m ? hourly.temperature_2m[idx] : 30,
        wind: hourly.wind_speed_10m ? hourly.wind_speed_10m[idx] : 10,
        code: hourly.weather_code ? hourly.weather_code[idx] : 0,
        cloudCover: hourly.cloud_cover ? hourly.cloud_cover[idx] : 50
      });
    }
  }

  // Find rain chances and potential rainy hours
  const maxPop = Math.max(...forecastWindow.map(h => h.pop || 0), 0);
  const currentPrecip = current.precipitation || 0;
  const isHeavyRainNow = currentPrecip >= 1.0 || [63, 65, 81, 82, 95, 96, 99].includes(current.weather_code);
  const isNight = current.is_day === 0;

  // Find rainy hours text using direct string slice (e.g. "17:00")
  const rainyHours = forecastWindow
    .filter(h => h.pop >= 45)
    .map(h => `${h.time.slice(11, 13)}:00`);

  let rainTimeNotice = '';
  if (rainyHours.length > 0) {
    if (rainyHours.length === 1) {
      rainTimeNotice = `ช่วง ${rainyHours[0]} น.`;
    } else {
      rainTimeNotice = `ช่วง ${rainyHours[0]} - ${rainyHours[rainyHours.length - 1]} น.`;
    }
  }

  // Calculate overall simplified score
  let score = 100;
  if (isHeavyRainNow) {
    score = 10;
  } else {
    if (maxPop >= 70) score -= 60;
    else if (maxPop >= 45) score -= 35;
    else if (maxPop >= 25) score -= 15;

    if (isNight) score -= 30;
    if ((current.uv_index || 0) < 3 && !isNight) score -= 15;
    if ((current.relative_humidity_2m || 60) > 80) score -= 15;
  }

  score = Math.max(5, Math.min(100, Math.round(score)));

  // Super friendly decision and advice
  let mainDecision = '';
  let decisionBadge = '';
  let friendlyAdvice = '';
  let themeStatus = 'good'; // excellent, good, caution, danger
  let heroIcon = '☀️🧺';

  if (isNight) {
    mainDecision = '🌙 ตอนนี้เป็นเวลากลางคืน';
    decisionBadge = 'ไม่มีแดด ผ้าแห้งช้า';
    friendlyAdvice = 'ตากตอนกลางคืนได้หากมีลมโกรก หรือเปิดพัดลมช่วย แต่ถ้าซักผ้านวมแนะนำรอแดดเช้าพรุ่งนี้จ้า';
    themeStatus = 'caution';
    heroIcon = '🌙👕';
  } else if (isHeavyRainNow || score <= 30) {
    mainDecision = '🌧️ วันนี้งดตากกลางแจ้งเด็ดขาด!';
    decisionBadge = 'เสี่ยงเปียกฝนสูงมาก';
    friendlyAdvice = rainTimeNotice 
      ? `มีกลุ่มฝนเสี่ยงตก ${rainTimeNotice} แนะนำให้ตากในบ้าน ใต้ชายคา หรือใช้เครื่องอบผ้าจ้า`
      : 'อากาศชื้นมากและมีเมฆฝนหนาแน่น ตากกลางแจ้งเสี่ยงฝนสาดและผ้ามีกลิ่นอับนะจ๊ะ';
    themeStatus = 'danger';
    heroIcon = '🌧️🚫';
  } else if (score < 65 || maxPop >= 45) {
    mainDecision = '⛅ ซักตากได้ แต่ต้องคอยดูฟ้านะ';
    decisionBadge = `ระวังฝน ${maxPop}%`;
    friendlyAdvice = rainTimeNotice 
      ? `ช่วงนี้แดดยังพอมี แต่ ${rainTimeNotice} เสี่ยงฝนตก แนะนำตากระเบียงที่มีหลังคา หรือเตรียมเก็บผ้าช่วงบ่ายจ้า`
      : 'วันนี้แดดสลับร่ม ผ้าแห้งได้แต่อาจใช้เวลาหน่อย แนะนำตากจุดที่ลมพัดผ่านสะดวกนะ';
    themeStatus = 'caution';
    heroIcon = '⛅👗';
  } else {
    mainDecision = '☀️ ซักตากได้เลย แดดดีมาก!';
    decisionBadge = 'แดดจัด แห้งไว ไร้กลิ่นอับ';
    friendlyAdvice = 'วันนี้ท้องฟ้าเปิด แดดดี ลมพัดสบาย โอกาสฝนต่ำมาก ซักผ้าชุดใหญ่ ผ้ายีนส์ หรือผ้าปูที่นอนได้เลย แห้งสนิทแน่นอน!';
    themeStatus = 'excellent';
    heroIcon = '☀️🧺';
  }

  // Estimated Drying Time
  const selectedFabric = FABRIC_TYPES[fabricType] || FABRIC_TYPES.normal;
  const dryingCalc = calculateDryingTime(current, forecastWindow, selectedFabric);

  // Simplified Quick 3 Cards Data
  const sunAndWindText = getSunAndWindFriendlyText(current);
  const rainSummaryText = maxPop <= 15 
    ? 'โอกาสฝนต่ำมาก (<15%) ปลอดภัยหายห่วง' 
    : (rainTimeNotice ? `เสี่ยงฝน ${maxPop}% (${rainTimeNotice})` : `โอกาสฝน ${maxPop}%`);
  const bestWindow = findBestDryingWindow(hourly, currentHourIndex);

  // Simplified Hourly Timeline (Next 10-12 hours from current hour)
  const hourlySafety = generateSimplifiedHourly(hourly, currentHourIndex, 10);

  return {
    score,
    mainDecision,
    decisionBadge,
    friendlyAdvice,
    themeStatus,
    heroIcon,
    maxPop,
    rainSummaryText,
    sunAndWindText,
    bestWindow,
    estimatedDryingText: dryingCalc.text,
    hourlySafety
  };
}

export function findCurrentHourIndex(times, currentIsoTime = null) {
  if (!times || !times.length) return 0;
  
  // 1. Match by prefix of current API time (e.g. "2026-08-26T16")
  if (currentIsoTime) {
    const currentPrefix = currentIsoTime.slice(0, 13);
    const idx = times.findIndex(t => t.startsWith(currentPrefix));
    if (idx !== -1) return idx;
  }

  // 2. Match by current Asia/Bangkok local time
  const now = new Date();
  const thaiFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false
  });
  const parts = thaiFormatter.formatToParts(now);
  const getPart = (type) => parts.find(p => p.type === type)?.value;
  const localPrefix = `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}`;
  
  const idx = times.findIndex(t => t.startsWith(localPrefix));
  if (idx !== -1) return idx;

  return 0;
}

function calculateDryingTime(current, forecastWindow, fabric) {
  let baseHours = fabric.baseHours;
  
  const temp = current.temperature_2m || 30;
  if (temp > 34) baseHours *= 0.85;
  else if (temp < 27) baseHours *= 1.25;

  const humidity = current.relative_humidity_2m || 65;
  if (humidity < 55) baseHours *= 0.85;
  else if (humidity > 78) baseHours *= 1.35;

  const uv = current.uv_index || 5;
  const isDay = current.is_day === 1;
  if (!isDay) baseHours *= 1.7;
  else if (uv >= 7) baseHours *= 0.8;
  else if (uv < 3) baseHours *= 1.2;

  const wind = current.wind_speed_10m || 10;
  if (wind > 15) baseHours *= 0.85;

  const roundedHours = Math.round(baseHours * 10) / 10;
  const wholeHours = Math.floor(roundedHours);
  const minutes = Math.round((roundedHours - wholeHours) * 60);

  let text = '';
  if (wholeHours > 0) text += `${wholeHours} ชม. `;
  if (minutes > 0) text += `${minutes} นาที`;
  if (!text) text = 'ประมาณ 1.5 - 2 ชั่วโมง';

  return { hours: roundedHours, text: text.trim() };
}

function getSunAndWindFriendlyText(current) {
  const uv = current.uv_index || 4;
  const wind = current.wind_speed_10m || 10;
  const isDay = current.is_day === 1;

  if (!isDay) return '🌙 กลางคืน ลมพัดเรื่อยๆ';

  if (uv >= 7 && wind >= 12) {
    return '☀️ แดดจัดมาก ลมพัดดี (แห้งไวสุดๆ)';
  } else if (uv >= 5) {
    return '🌤️ แดดกำลังดี ลมพัดสบาย';
  } else if (uv >= 3) {
    return '⛅ แดดร่มสลับแดดออก อากาศอบอ้าว';
  } else {
    return '☁️ เมฆครึ้ม แดดน้อย';
  }
}

function findBestDryingWindow(hourly, startIndex) {
  if (!hourly || !hourly.time) return '09:00 - 13:00 น.';
  
  let bestStart = null;
  let bestEnd = null;

  const count = Math.min(24, hourly.time.length - startIndex);
  
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const uv = hourly.uv_index ? hourly.uv_index[idx] : 0;
    const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;
    const hourNum = parseInt(hourly.time[idx].slice(11, 13), 10);

    if (hourNum >= 8 && hourNum <= 16) {
      if (pop <= 30 && uv >= 3) {
        if (bestStart === null) bestStart = hourNum;
        bestEnd = hourNum + 1;
      }
    }
  }

  if (bestStart !== null && bestEnd !== null) {
    return `${String(bestStart).padStart(2, '0')}:00 - ${String(bestEnd).padStart(2, '0')}:00 น.`;
  }
  return '09:00 - 13:00 น. (ช่วงแดดแรง)';
}

function generateSimplifiedHourly(hourly, startIndex, count = 10) {
  const result = [];
  const len = Math.min(count, hourly.time.length - startIndex);

  for (let i = 0; i < len; i++) {
    const idx = startIndex + i;
    const timeStr = hourly.time[idx];
    const hourText = i === 0 ? 'ตอนนี้' : timeStr.slice(11, 16);
    const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;
    const isDay = hourly.is_day ? hourly.is_day[idx] : 1;
    const code = hourly.weather_code ? hourly.weather_code[idx] : 0;

    let icon = '☀️';
    let statusText = 'ตากได้';
    let statusClass = 'safe';

    if (pop >= 60 || [63,65,81,82,95,96,99].includes(code)) {
      icon = '🌧️';
      statusText = 'ฝนตก';
      statusClass = 'danger';
    } else if (pop >= 35 || [51,53,55,61,80].includes(code)) {
      icon = '🌦️';
      statusText = 'ระวังฝน';
      statusClass = 'caution';
    } else if (code === 3) {
      icon = '☁️';
      statusText = 'เมฆครึ้ม';
      statusClass = 'safe';
    } else if (code === 2 || code === 1) {
      icon = isDay ? '🌤️' : '🌙';
      statusText = 'ตากได้';
      statusClass = 'safe';
    } else {
      icon = isDay ? '☀️' : '🌙';
      statusText = 'แดดดี';
      statusClass = 'safe';
    }

    result.push({
      time: timeStr,
      hourText,
      icon,
      pop,
      statusText,
      statusClass
    });
  }

  return result;
}
