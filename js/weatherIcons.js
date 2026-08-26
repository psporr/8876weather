/**
 * Weather codes & Thai descriptions based on WMO Weather interpretation codes (WW)
 */
export const WMO_WEATHER_MAP = {
  0: {
    label: 'ท้องฟ้าแจ่มใส',
    desc: 'แดดจัด ไร้เมฆ ท้องฟ้าโปร่ง',
    icon: '☀️',
    type: 'clear-day',
    nightIcon: '🌙',
    nightDesc: 'ท้องฟ้าโปร่ง ดาวระยิบระยับ',
    laundryRatingBonus: 20
  },
  1: {
    label: 'ท้องฟ้าโปร่งเป็นส่วนใหญ่',
    desc: 'แดดดี มีเมฆบางตา',
    icon: '🌤️',
    type: 'mainly-clear',
    nightIcon: '🌤️',
    nightDesc: 'มีเมฆบางส่วน',
    laundryRatingBonus: 15
  },
  2: {
    label: 'มีเมฆบางส่วน',
    desc: 'แดดสลับร่ม มีเมฆกระจายตัว',
    icon: '⛅',
    type: 'partly-cloudy',
    nightIcon: '☁️',
    nightDesc: 'มีเมฆเป็นหย่อมๆ',
    laundryRatingBonus: 5
  },
  3: {
    label: 'มีเมฆมาก / ท้องฟ้าครึ้ม',
    desc: 'เมฆปกคลุมหนาแน่น แสงแดดน้อย',
    icon: '☁️',
    type: 'overcast',
    nightIcon: '☁️',
    nightDesc: 'มีเมฆหนาทึบ',
    laundryRatingBonus: -10
  },
  45: {
    label: 'มีหมอกหนา',
    desc: 'ทัศนวิสัยต่ำ ความชื้นสูง',
    icon: '🌫️',
    type: 'fog',
    nightIcon: '🌫️',
    nightDesc: 'มีหมอกลง',
    laundryRatingBonus: -20
  },
  48: {
    label: 'มีหมอกน้ำค้าง',
    desc: 'อากาศชื้น หมอกน้ำค้างลง',
    icon: '🌫️',
    type: 'fog',
    nightIcon: '🌫️',
    nightDesc: 'หมอกน้ำค้าง',
    laundryRatingBonus: -20
  },
  51: {
    label: 'เมฆครึ้ม / เสี่ยงละอองฝน',
    desc: 'ท้องฟ้าครึ้มหนาแน่น มีโอกาสเกิดละอองฝนหรือฝนโปรย',
    icon: '🌦️',
    type: 'drizzle',
    nightIcon: '🌧️',
    nightDesc: 'เมฆครึ้ม เสี่ยงละอองฝนยามค่ำ',
    laundryRatingBonus: -40
  },
  53: {
    label: 'มีละอองฝนโปรยปราย',
    desc: 'มีละอองฝนหรือฝนเบาบางสม่ำเสมอ',
    icon: '🌧️',
    type: 'drizzle',
    nightIcon: '🌧️',
    nightDesc: 'ละอองฝนโปรยปราย',
    laundryRatingBonus: -50
  },
  55: {
    label: 'ละอองฝนหนาแน่น',
    desc: 'ฝนละอองหนาเม็ดต่อเนื่อง',
    icon: '🌧️',
    type: 'drizzle',
    nightIcon: '🌧️',
    nightDesc: 'ฝนละอองหนาแน่น',
    laundryRatingBonus: -60
  },
  61: {
    label: 'ฝนตกเล็กน้อย',
    desc: 'มีฝนตกเบาๆ เป็นหย่อมๆ',
    icon: '🌦️',
    type: 'rain-light',
    nightIcon: '🌧️',
    nightDesc: 'ฝนตกเบาๆ',
    laundryRatingBonus: -70
  },
  63: {
    label: 'ฝนตกปานกลาง',
    desc: 'ฝนตกต่อเนื่องสม่ำเสมอ',
    icon: '🌧️',
    type: 'rain',
    nightIcon: '🌧️',
    nightDesc: 'ฝนตกปานกลาง',
    laundryRatingBonus: -90
  },
  65: {
    label: 'ฝนตกหนัก',
    desc: 'ฝนตกหนักมาก น้ำระบายช้า',
    icon: '⛈️',
    type: 'rain-heavy',
    nightIcon: '⛈️',
    nightDesc: 'ฝนตกหนักมาก',
    laundryRatingBonus: -100
  },
  80: {
    label: 'ฝนซู่กระจายบางพื้นที่',
    desc: 'มีเมฆฝนก่อตัว ฝนตกซู่เป็นพักๆ',
    icon: '🌦️',
    type: 'shower-light',
    nightIcon: '🌧️',
    nightDesc: 'ฝนซู่เป็นระยะ',
    laundryRatingBonus: -60
  },
  81: {
    label: 'ฝนซู่ปานกลาง',
    desc: 'ฝนไล่ช้างตกซู่สลับหยุด',
    icon: '🌧️',
    type: 'shower',
    nightIcon: '🌧️',
    nightDesc: 'ฝนตกซู่เป็นพักๆ',
    laundryRatingBonus: -80
  },
  82: {
    label: 'ฝนซู่รุนแรง',
    desc: 'ฝนตกกระหน่ำอย่างรวดเร็ว',
    icon: '⛈️',
    type: 'shower-heavy',
    nightIcon: '⛈️',
    nightDesc: 'ฝนตกกระหน่ำ',
    laundryRatingBonus: -100
  },
  95: {
    label: 'ฝนฟ้าคะนอง',
    desc: 'มีฟ้าร้อง ฟ้าผ่า และฝนตก',
    icon: '⛈️',
    type: 'thunderstorm',
    nightIcon: '⛈️',
    nightDesc: 'ฝนฟ้าคะนองรุนแรง',
    laundryRatingBonus: -100
  },
  96: {
    label: 'พายุฝนฟ้าคะนองลมกระโชกแรง',
    desc: 'พายุรุนแรง ลมกระโชกแรงจัด',
    icon: '⛈️',
    type: 'thunderstorm',
    nightIcon: '⛈️',
    nightDesc: 'พายุฟ้าคะนองลมแรง',
    laundryRatingBonus: -100
  },
  99: {
    label: 'พายุฝนฟ้าคะนองรุนแรงมาก',
    desc: 'พายุฝนตกหนักและลมกระโชกแรงจัด',
    icon: '⛈️',
    type: 'thunderstorm',
    nightIcon: '⛈️',
    nightDesc: 'พายุรุนแรงมาก',
    laundryRatingBonus: -100
  }
};

export function getWeatherInfo(code, isDay = 1) {
  const defaultInfo = {
    label: 'สภาพอากาศปกติ',
    desc: 'สภาพอากาศทั่วไป',
    icon: isDay ? '🌤️' : '🌙',
    type: isDay ? 'partly-cloudy' : 'night',
    nightIcon: '🌙',
    nightDesc: 'สภาพอากาศทั่วไป',
    laundryRatingBonus: 0
  };

  const weather = WMO_WEATHER_MAP[code] || defaultInfo;
  return {
    ...weather,
    displayIcon: (isDay || !weather.nightIcon) ? weather.icon : weather.nightIcon,
    displayDesc: (isDay || !weather.nightDesc) ? weather.desc : weather.nightDesc
  };
}

export function getWindDirectionThai(degree) {
  const directions = [
    'เหนือ (N)', 'ตะวันออกเฉียงเหนือ (NE)', 'ตะวันออก (E)',
    'ตะวันออกเฉียงใต้ (SE)', 'ใต้ (S)', 'ตะวันตกเฉียงใต้ (SW)',
    'ตะวันตก (W)', 'ตะวันตกเฉียงเหนือ (NW)'
  ];
  const index = Math.round(((degree %= 360) < 0 ? degree + 360 : degree) / 45) % 8;
  return directions[index];
}

export function formatThaiTime(isoString, includeDate = false) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  if (!includeDate) {
    return `${hours}:${minutes} น.`;
  }

  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  return `${day} ${month} ${hours}:${minutes} น.`;
}

export function formatThaiDateShort(isoDateString) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  return {
    dayName: thaiDays[date.getDay()],
    dayNumber: date.getDate(),
    monthName: thaiMonths[date.getMonth()],
    formatted: `${thaiDays[date.getDay()]} ${date.getDate()} ${thaiMonths[date.getMonth()]}`
  };
}
