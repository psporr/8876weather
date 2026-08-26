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
  const currentHourIndex = findCurrentHourIndex(hourly.time);
  
  // Extract next 3 to 8 hours forecast window
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
        code: hourly.weather_code ? hourly.weather_code[idx] : 0
      });
    }
  }

  // 1. Rain Risk Factor (0 - 100 penalty)
  const maxPop = Math.max(...forecastWindow.map(h => h.pop || 0), 0);
  const totalExpectedRain = forecastWindow.reduce((acc, h) => acc + (h.rain || 0), 0);
  const isCurrentlyRaining = (current.precipitation || 0) > 0 || [51,53,55,61,63,65,80,81,82,95,96,99].includes(current.weather_code);

  let score = 100;
  const warnings = [];
  const highlights = [];

  if (isCurrentlyRaining) {
    score = 5;
    warnings.push('ขณะนี้มีฝนตกในพื้นที่');
  } else {
    // Rain probability penalty
    if (maxPop >= 70) {
      score -= 75;
      warnings.push(`โอกาสฝนตกสูงมากถึง ${maxPop}% ใน 6 ชม. ข้างหน้า`);
    } else if (maxPop >= 50) {
      score -= 50;
      warnings.push(`โอกาสฝนตกปานกลาง-สูง (${maxPop}%) เสี่ยงฝนตก`);
    } else if (maxPop >= 30) {
      score -= 25;
      warnings.push(`มีโอกาสเกิดฝน ${maxPop}% ควรเฝ้าระวัง`);
    } else if (maxPop <= 15) {
      highlights.push(`โอกาสฝนตกต่ำมากเพียง ${maxPop}%`);
    }

    if (totalExpectedRain > 2.0) {
      score -= 30;
      warnings.push('คาดว่าจะมีปริมาณน้ำฝนสะสม');
    }
  }

  // 2. Solar & UV Factor (High UV and high daytime temp dry clothes fast)
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
      highlights.push(`แดดดี (UV ${currentUV.toFixed(1)}) เหมาะตากผ้า`);
    } else if (currentUV < 3) {
      score -= 15;
      warnings.push('แสงแดดอ่อน/มีเมฆบัง ทำให้ผ้าแห้งช้า');
    }
  }

  // 3. Humidity Factor
  const humidity = current.relative_humidity_2m || 65;
  if (humidity >= 85) {
    score -= 25;
    warnings.push(`ความชื้นสูงมาก (${humidity}%) เสี่ยงผ้ามีกลิ่นอับ`);
  } else if (humidity >= 75) {
    score -= 12;
    warnings.push(`ความชื้นค่อนข้างสูง (${humidity}%)`);
  } else if (humidity <= 55) {
    score += 10;
    highlights.push(`อากาศแห้งสบาย ความชื้นต่ำ (${humidity}%) ระบายน้ำได้ดี`);
  }

  // 4. Wind Factor
  const windSpeed = current.wind_speed_10m || 10;
  if (windSpeed >= 18) {
    score += 10;
    highlights.push(`ลมพัดดี (${windSpeed.toFixed(1)} กม./ชม.) ช่วยพัดผ้าแห้งเร็วขึ้น`);
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
      warnings.push(`ค่าฝุ่น PM2.5 สูง (${pm25.toFixed(1)} µg/m³) เสี่ยงฝุ่นเกาะผ้า`);
    } else if (pm25 <= 25) {
      highlights.push(`อากาศสะอาด PM2.5 ต่ำ (${pm25.toFixed(1)} µg/m³) ปลอดภัย`);
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
    advice = 'แดดจัด ลมพัดดี โอกาสฝนต่ำมาก ผ้าจะแห้งสนิท ไร้กลิ่นอับแน่นอน รีบซักและตากได้เลย';
  } else if (score >= 60) {
    statusKey = 'GOOD';
    badgeText = 'ซักตากได้ 👍 แดดดีพอสมควร';
    badgeClass = 'status-good';
    icon = '🌤️👕';
    title = 'ซักและตากกลางแจ้งได้ตามปกติ';
    advice = 'สภาพอากาศอยู่ในเกณฑ์ดี แดดส่องสม่ำเสมอ แนะนำให้ตากในช่วงที่แดดส่องตรงเพื่อประสิทธิภาพสูงสุด';
  } else if (score >= 40) {
    statusKey = 'CAUTION';
    badgeText = 'เฝ้าระวัง ⚠️ อาจแห้งช้า/เสี่ยงฝน';
    badgeClass = 'status-caution';
    icon = '⛅👗';
    title = 'ควรตากในที่ร่มที่มีอากาศถ่ายเท หรือคอยดูฟ้าฝน';
    advice = 'มีความชื้นหรือเมฆบดบังแดด และมีโอกาสเกิดฝนเล็กน้อย แนะนำให้ตากในระเบียงที่มีหลังคา หรือตากในที่ร่มเปิดพัดลมช่วย';
  } else {
    statusKey = 'POOR';
    badgeText = 'งดตากกลางแจ้ง 🌧️ เสี่ยงฝน/ความชื้นสูง';
    badgeClass = 'status-poor';
    icon = '🌧️🚫';
    title = 'งดตากผ้ากลางแจ้งเด็ดขาด!';
    advice = 'มีความเสี่ยงฝนตกสูงมากหรือกำลังมีฝนตก ความชื้นสูงทำให้ผ้าไม่แห้งและสะสมกลิ่นอับ แนะนำให้ใช้เครื่องอบผ้าหรือตากในอาคาร';
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

function findCurrentHourIndex(times) {
  if (!times || !times.length) return 0;
  const now = new Date();
  const currentIsoHour = now.toISOString().slice(0, 13); // "2026-08-26T08" in UTC or local
  
  // Find closest matching local time string
  const currentLocalHour = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}`;
  
  let closestIdx = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i].startsWith(currentLocalHour)) {
      return i;
    }
  }
  return 0;
}

function calculateDryingTime(current, forecastWindow, fabric) {
  let baseHours = fabric.baseHours;
  
  // Temperature effect (Standard 30°C base)
  const temp = current.temperature_2m || 30;
  if (temp > 35) baseHours *= 0.8;
  else if (temp > 32) baseHours *= 0.9;
  else if (temp < 25) baseHours *= 1.3;

  // Humidity effect (Standard 60% base)
  const humidity = current.relative_humidity_2m || 65;
  if (humidity < 50) baseHours *= 0.8;
  else if (humidity > 80) baseHours *= 1.4;
  else if (humidity > 70) baseHours *= 1.2;

  // UV / Sun effect
  const uv = current.uv_index || 5;
  const isDay = current.is_day === 1;
  if (!isDay) baseHours *= 1.8;
  else if (uv > 7) baseHours *= 0.8;
  else if (uv < 3) baseHours *= 1.25;

  // Wind effect
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
  let maxScore = -1;

  const count = Math.min(24, hourly.time.length - startIndex);
  
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const uv = hourly.uv_index ? hourly.uv_index[idx] : 0;
    const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;
    const hourTime = new Date(hourly.time[idx]);
    const hourNum = hourTime.getHours();

    // Prefer daytime 07:00 to 17:00
    if (hourNum >= 7 && hourNum <= 17) {
      const hourScore = (uv * 10) - (pop * 1.2);
      if (pop <= 25 && uv >= 3) {
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

    let status = 'safe'; // safe, caution, danger
    let statusText = 'ปลอดภัย';
    
    if (pop >= 60 || rain > 0.5) {
      status = 'danger';
      statusText = 'เสี่ยงฝนตก';
    } else if (pop >= 30) {
      status = 'caution';
      statusText = 'ระวังฝน';
    } else if (uv >= 5) {
      status = 'safe';
      statusText = 'แดดดีมาก';
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
