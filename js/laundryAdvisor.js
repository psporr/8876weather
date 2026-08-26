/**
 * Laundry & Clothes Drying Advisor Engine
 * Analyzes weather conditions to provide actionable clothes washing and outdoor drying advice.
 */

export const FABRIC_TYPES = {
  thin: { label: 'ผ้าบาง / เสื้อยืด / ชุดกีฬา', multiplier: 0.8, baseHours: 2.0 },
  normal: { label: 'ผ้าทั่วไป / เสื้อเชิ้ต / กางเกงผ้า', multiplier: 1.0, baseHours: 3.0 },
  heavy: { label: 'ผ้าหนา / ผ้ายีนส์ / เสื้อกันหนาว', multiplier: 1.6, baseHours: 4.8 },
  bedding: { label: 'ผ้าปูที่นอน / ผ้านวม / ผ้าเช็ดตัวหนา', multiplier: 2.0, baseHours: 6.0 }
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

  // 1. Rain Risk Factor Analysis
  const maxPop = Math.max(...forecastWindow.map(h => h.pop || 0), 0);
  const totalExpectedRain = forecastWindow.reduce((acc, h) => acc + (h.rain || 0), 0);
  
  // Distinguish between active heavy rain vs light drizzle / gathering rain clouds
  const currentPrecip = current.precipitation || 0;
  const isHeavyRainNow = currentPrecip >= 1.0 || [63, 65, 81, 82, 95, 96, 99].includes(current.weather_code);
  const isLightPrecipOrClouds = currentPrecip > 0 && currentPrecip < 1.0 || [51, 53, 55, 61, 80].includes(current.weather_code);

  let score = 100;
  const warnings = [];
  const highlights = [];

  if (isHeavyRainNow) {
    score = 5;
    warnings.push('มีฝนตกหนักหรือพายุในพื้นที่ขณะนี้');
  } else {
    // Rain probability penalty
    if (maxPop >= 70) {
      score -= 55;
      warnings.push(`มีโอกาสฝนตกสูง ${maxPop}% ในช่วง 6 ชม. ข้างหน้า`);
    } else if (maxPop >= 50) {
      score -= 35;
      warnings.push(`โอกาสฝนตก ${maxPop}% มีความเสี่ยงฝนโปรย`);
    } else if (maxPop >= 30) {
      score -= 20;
      warnings.push(`โอกาสฝน ${maxPop}% ควรเฝ้าระวังช่วงเย็น`);
    } else if (maxPop <= 15) {
      highlights.push(`โอกาสฝนตกต่ำมากเพียง ${maxPop}%`);
    }

    if (totalExpectedRain > 2.0) {
      score -= 25;
      warnings.push(`คาดว่าจะมีปริมาณฝนสะสม ${totalExpectedRain.toFixed(1)} มม.`);
    }

    if (isLightPrecipOrClouds) {
      warnings.push('กลุ่มเมฆฝนกำลังเคลื่อนผ่าน / ฟ้าครึ้ม');
    }
  }

  // 2. Solar & UV Factor (High UV and daytime temp dry clothes fast)
  const currentUV = current.uv_index !== undefined ? current.uv_index : 5;
  const isDay = current.is_day === 1;

  if (!isDay) {
    score -= 30;
    warnings.push('เป็นช่วงเวลากลางคืน (ไม่มีแสงแดด ช่วยให้แห้งช้าลง)');
  } else {
    if (currentUV >= 8) {
      score += 15;
      highlights.push(`แดดแรงจัด (UV ${currentUV.toFixed(1)}) ฆ่าเชื้อและแห้งไว`);
    } else if (currentUV >= 5) {
      score += 10;
      highlights.push(`แดดดี (UV ${currentUV.toFixed(1)})`);
    } else if (currentUV < 3) {
      score -= 15;
      warnings.push('แสงแดดน้อย / เมฆบังแดด');
    }
  }

  // 3. Humidity Factor
  const humidity = current.relative_humidity_2m || 65;
  if (humidity >= 85) {
    score -= 20;
    warnings.push(`ความชื้นสูงมาก (${humidity}%) เสี่ยงผ้ามีกลิ่นอับ`);
  } else if (humidity >= 75) {
    score -= 10;
    warnings.push(`ความชื้นค่อนข้างสูง (${humidity}%)`);
  } else if (humidity <= 55) {
    score += 10;
    highlights.push(`อากาศแห้งสบาย ความชื้นต่ำ (${humidity}%)`);
  }

  // 4. Wind Factor
  const windSpeed = current.wind_speed_10m || 10;
  if (windSpeed >= 18) {
    score += 10;
    highlights.push(`ลมพัดดี (${windSpeed.toFixed(1)} กม./ชม.) พัดผ้าแห้งเร็ว`);
  } else if (windSpeed < 5) {
    score -= 5;
    warnings.push('ลมนิ่ง อากาศถ่ายเทช้า');
  }

  // 5. Air Quality PM2.5 Factor
  let pm25 = null;
  if (airQualityData && airQualityData.current && airQualityData.current.pm2_5 !== undefined) {
    pm25 = airQualityData.current.pm2_5;
    if (pm25 >= 50) {
      score -= 15;
      warnings.push(`ค่าฝุ่น PM2.5 สูง (${pm25.toFixed(1)} µg/m³) เสี่ยงฝุ่นเกาะ`);
    } else if (pm25 <= 25) {
      highlights.push(`อากาศสะอาด PM2.5 ต่ำ (${pm25.toFixed(1)} µg/m³)`);
    }
  }

  // Normalize Score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine Level & Recommendation
  let statusKey, badgeText, badgeClass, title, advice, icon;
  
  if (score >= 80) {
    statusKey = 'EXCELLENT';
    badgeText = 'เหมาะมาก 🌟 ซักตากได้เลย';
    badgeClass = 'status-excellent';
    icon = '☀️🧺';
    title = 'สภาพอากาศยอดเยี่ยมสำหรับการตากผ้ากลางแจ้ง!';
    advice = 'แดดจัด ลมพัดดี โอกาสฝนต่ำมาก ผ้าจะแห้งสนิท ไร้กลิ่นอับแน่นอน ซักตากกลางแจ้งได้เต็มที่';
  } else if (score >= 60) {
    statusKey = 'GOOD';
    badgeText = 'ซักตากได้ 👍 แดดปานกลาง';
    badgeClass = 'status-good';
    icon = '🌤️👕';
    title = 'ซักและตากกลางแจ้งได้ตามปกติ';
    advice = 'สภาพอากาศอยู่ในเกณฑ์ดี แดดส่องสม่ำเสมอ แนะนำให้ตากในช่วงแดดออกเพื่อประสิทธิภาพสูงสุด';
  } else if (score >= 35) {
    statusKey = 'CAUTION';
    badgeText = 'เฝ้าระวัง ⚠️ เสี่ยงฝนช่วงบ่าย-เย็น';
    badgeClass = 'status-caution';
    icon = '⛅👗';
    title = 'ตากได้ชั่วคราว แต่ควรมีคนคอยดูฟ้าฝนหรือตากใต้ชายคา';
    advice = maxPop >= 50 
      ? `ขณะนี้รอบพื้นที่อาจยังไม่ตก แต่แบบจำลองตรวจพบโอกาสฝนตกสูงถึง ${maxPop}% ในอีก 2-4 ชม. ข้างหน้า แนะนำตากในระเบียงมีหลังคาหรือพร้อมเก็บ`
      : 'มีเมฆบังแดดหรือความชื้นสูง ผ้าอาจแห้งช้ากว่าปกติ แนะนำให้ตากในที่ลมโกรก';
  } else {
    statusKey = 'POOR';
    badgeText = 'ไม่แนะนำกลางแจ้ง 🌧️ เสี่ยงฝนสูง';
    badgeClass = 'status-poor';
    icon = '🌧️🚫';
    title = 'เสี่ยงฝนตกสูง หรือความชื้นสูงมาก!';
    advice = maxPop >= 60
      ? `แม้ตอนนี้อาจยังไม่ตกในจุดที่คุณอยู่ แต่มีกลุ่มเมฆฝนหนาแน่นครอบคลุมพื้นที่สุขสวัสดิ์-พระราม 3 เสี่ยงฝนเทกะทันหัน แนะนำตากในร่มหรืออบผ้า`
      : 'ความชื้นสูงและไม่มีแสงแดด ทำให้ผ้าแห้งยากและเกิดกลิ่นอับ แนะนำให้ใช้เครื่องอบผ้าหรือตากในอาคาร';
  }

  // Estimated Drying Time Calculation
  const selectedFabric = FABRIC_TYPES[fabricType] || FABRIC_TYPES.normal;
  const dryingCalc = calculateDryingTime(current, forecastWindow, selectedFabric);

  // Best Drying Hours Window Analysis
  const bestWindow = findBestDryingWindow(hourly, currentHourIndex);

  // Generate hourly laundry index for the next 12 hours
  const hourlySafety = generateHourlySafetyTimeline(hourly, currentHourIndex, 12);

  return {
    score,
    statusKey,
    badgeText,
    badgeClass,
    icon,
    title,
    advice,
    highlights,
    warnings,
    maxRainChance: maxPop,
    humidity,
    currentUV,
    windSpeed,
    pm25,
    estimatedHours: dryingCalc.hours,
    estimatedTimeText: dryingCalc.text,
    bestWindow,
    hourlySafety,
    forecastWindow
  };
}

function findCurrentHourIndex(times, currentIsoTime = null) {
  if (!times || !times.length) return 0;
  
  if (currentIsoTime) {
    const idx = times.indexOf(currentIsoTime);
    if (idx !== -1) return idx;
  }

  const now = new Date();
  const currentIsoHour = now.toISOString().slice(0, 13);
  for (let i = 0; i < times.length; i++) {
    if (times[i].startsWith(currentIsoHour)) {
      return i;
    }
  }
  return 0;
}

function calculateDryingTime(current, forecastWindow, fabric) {
  let baseHours = fabric.baseHours;
  
  const temp = current.temperature_2m || 30;
  if (temp > 35) baseHours *= 0.8;
  else if (temp > 32) baseHours *= 0.9;
  else if (temp < 25) baseHours *= 1.3;

  const humidity = current.relative_humidity_2m || 65;
  if (humidity < 50) baseHours *= 0.8;
  else if (humidity > 80) baseHours *= 1.4;
  else if (humidity > 70) baseHours *= 1.2;

  const uv = current.uv_index || 5;
  const isDay = current.is_day === 1;
  if (!isDay) baseHours *= 1.8;
  else if (uv > 7) baseHours *= 0.8;
  else if (uv < 3) baseHours *= 1.25;

  const wind = current.wind_speed_10m || 10;
  if (wind > 15) baseHours *= 0.85;
  else if (wind < 5) baseHours *= 1.15;

  const roundedHours = Math.round(baseHours * 10) / 10;
  const wholeHours = Math.floor(roundedHours);
  const minutes = Math.round((roundedHours - wholeHours) * 60);

  let text = '';
  if (wholeHours > 0) {
    text += `${wholeHours} ชม. `;
  }
  if (minutes > 0) {
    text += `${minutes} นาที`;
  }
  if (!text) text = 'ประมาณ 1 ชั่วโมง';

  return {
    hours: roundedHours,
    text: text.trim()
  };
}

function findBestDryingWindow(hourly, startIndex) {
  if (!hourly || !hourly.time) return '09:00 - 14:00 น.';
  
  let bestStart = null;
  let bestEnd = null;

  const count = Math.min(24, hourly.time.length - startIndex);
  
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const uv = hourly.uv_index ? hourly.uv_index[idx] : 0;
    const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;
    const hourTime = new Date(hourly.time[idx]);
    const hourNum = hourTime.getHours();

    if (hourNum >= 7 && hourNum <= 17) {
      if (pop <= 30 && uv >= 3) {
        if (bestStart === null) bestStart = hourNum;
        bestEnd = hourNum + 1;
      }
    }
  }

  if (bestStart !== null && bestEnd !== null) {
    return `${String(bestStart).padStart(2, '0')}:00 - ${String(bestEnd).padStart(2, '0')}:00 น.`;
  }
  return '09:00 - 13:00 น. (ช่วงแดดส่องสูงสุด)';
}

function generateHourlySafetyTimeline(hourly, startIndex, hoursCount = 12) {
  const result = [];
  const len = Math.min(hoursCount, hourly.time.length - startIndex);

  for (let i = 0; i < len; i++) {
    const idx = startIndex + i;
    const timeStr = hourly.time[idx];
    const date = new Date(timeStr);
    const hourText = `${String(date.getHours()).padStart(2, '0')}:00`;
    const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;
    const uv = hourly.uv_index ? hourly.uv_index[idx] : 0;
    const temp = hourly.temperature_2m ? hourly.temperature_2m[idx] : 30;
    const rain = hourly.precipitation ? hourly.precipitation[idx] : 0;

    let status = 'safe';
    let statusText = 'ปลอดภัย';
    
    if (pop >= 60 || rain > 0.5) {
      status = 'danger';
      statusText = 'เสี่ยงฝนตก';
    } else if (pop >= 30) {
      status = 'caution';
      statusText = 'ระวังฝน';
    } else if (uv >= 5) {
      status = 'safe';
      statusText = 'แดดดี';
    } else {
      status = 'safe';
      statusText = 'ตากได้';
    }

    result.push({
      time: timeStr,
      hourText,
      pop,
      uv,
      temp,
      rain,
      status,
      statusText
    });
  }

  return result;
}
