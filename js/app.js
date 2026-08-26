/**
 * Main Application Controller for Thai Weather & Laundry Advisory App
 */

import { 
  DEFAULT_LOCATION, 
  PRESET_LOCATIONS, 
  fetchWeatherData, 
  fetchAirQualityData, 
  searchLocations, 
  saveLastLocation, 
  getLastLocation 
} from './api.js';

import { 
  calculateLaundryAdvisor, 
  FABRIC_TYPES 
} from './laundryAdvisor.js';

import { 
  getWeatherInfo, 
  getWindDirectionThai, 
  formatThaiTime, 
  formatThaiDateShort 
} from './weatherIcons.js';

import { weatherAnimator } from './weatherAnim.js';

class WeatherApp {
  constructor() {
    this.currentLocation = getLastLocation();
    this.weatherData = null;
    this.airQualityData = null;
    this.selectedFabric = 'normal';
    this.searchDebounceTimer = null;

    this.initElements();
    this.initEvents();
    this.renderPresets();
    this.loadData();
    this.startClock();
  }

  initElements() {
    this.el = {
      // Time & Status
      thaiTime: document.getElementById('current-thai-time'),
      btnRefresh: document.getElementById('btn-refresh'),
      btnGps: document.getElementById('btn-gps'),
      btnRadar: document.getElementById('btn-radar'),
      radarModal: document.getElementById('radar-modal'),
      btnCloseRadar: document.getElementById('btn-close-radar'),
      
      // Location
      locationName: document.getElementById('current-location-name'),
      locationSubtext: document.getElementById('current-location-subtext'),
      defaultTag: document.getElementById('default-location-tag'),
      presetsContainer: document.getElementById('preset-buttons-container'),
      searchInput: document.getElementById('location-search-input'),
      searchDropdown: document.getElementById('search-dropdown-list'),
      btnSearchTrigger: document.getElementById('btn-search-trigger'),

      // Laundry Card
      laundrySection: document.getElementById('laundry-advisor-section'),
      laundryIcon: document.getElementById('laundry-hero-icon'),
      laundryStatusBadge: document.getElementById('laundry-status-badge'),
      laundryScoreNum: document.getElementById('laundry-score-num'),
      scoreDialBar: document.getElementById('score-dial-bar'),
      laundryMainTitle: document.getElementById('laundry-main-title'),
      laundryDescription: document.getElementById('laundry-description'),
      laundryFactorsTags: document.getElementById('laundry-factors-tags'),
      estimatedDryingBadge: document.getElementById('estimated-drying-badge'),
      fabricButtonsGroup: document.getElementById('fabric-buttons-group'),
      bestWindowText: document.getElementById('best-window-text'),
      laundryTimelineStrip: document.getElementById('laundry-timeline-strip'),

      // Current Weather Hero
      currentTemp: document.getElementById('current-temp'),
      currentWeatherIcon: document.getElementById('current-weather-icon'),
      weatherWmoTitle: document.getElementById('weather-wmo-title'),
      weatherDetailedDesc: document.getElementById('weather-detailed-desc'),
      realFeelPill: document.getElementById('real-feel-pill'),
      tempMaxMinPill: document.getElementById('temp-max-min-pill'),
      cloudCoverPill: document.getElementById('cloud-cover-pill'),

      // Metrics Cards
      metricRainPop: document.getElementById('metric-rain-pop'),
      metricRainSum: document.getElementById('metric-rain-sum'),
      metricHumidity: document.getElementById('metric-humidity'),
      metricHumidityDesc: document.getElementById('metric-humidity-desc'),
      metricUv: document.getElementById('metric-uv'),
      metricUvDesc: document.getElementById('metric-uv-desc'),
      metricWind: document.getElementById('metric-wind'),
      metricWindDir: document.getElementById('metric-wind-dir'),
      metricPm25: document.getElementById('metric-pm25'),
      metricPm25Status: document.getElementById('metric-pm25-status'),
      metricSunTimes: document.getElementById('metric-sun-times'),
      metricSunSub: document.getElementById('metric-sun-sub'),

      // Forecast Lists
      hourlyForecastContainer: document.getElementById('hourly-forecast-container'),
      dailyForecastContainer: document.getElementById('daily-forecast-container'),

      // Toasts
      toastContainer: document.getElementById('toast-container')
    };
  }

  initEvents() {
    // Refresh button
    this.el.btnRefresh.addEventListener('click', () => {
      this.el.btnRefresh.style.transform = 'rotate(360deg)';
      this.showToast('กำลังอัปเดตข้อมูลสภาพอากาศล่าสุด...');
      this.loadData();
      setTimeout(() => {
        this.el.btnRefresh.style.transform = 'none';
      }, 700);
    });

    // GPS Geolocation button
    this.el.btnGps.addEventListener('click', () => this.handleGeolocation());

    // Radar modal open / close
    if (this.el.btnRadar && this.el.radarModal) {
      this.el.btnRadar.addEventListener('click', () => {
        this.el.radarModal.classList.add('show');
      });
    }
    if (this.el.btnCloseRadar && this.el.radarModal) {
      this.el.btnCloseRadar.addEventListener('click', () => {
        this.el.radarModal.classList.remove('show');
      });
      this.el.radarModal.addEventListener('click', (e) => {
        if (e.target === this.el.radarModal) {
          this.el.radarModal.classList.remove('show');
        }
      });
    }

    // Fabric Type Buttons
    this.el.fabricButtonsGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.fabric-btn');
      if (!btn) return;
      
      this.el.fabricButtonsGroup.querySelectorAll('.fabric-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.selectedFabric = btn.dataset.fabric;
      this.updateLaundrySection();
    });

    // Search input with debounce
    this.el.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.searchDebounceTimer);
      const query = e.target.value;
      if (query.trim().length < 2) {
        this.el.searchDropdown.classList.remove('show');
        return;
      }
      this.searchDebounceTimer = setTimeout(() => this.performSearch(query), 350);
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box-container')) {
        this.el.searchDropdown.classList.remove('show');
      }
    });

    // Search trigger button
    this.el.btnSearchTrigger.addEventListener('click', () => {
      const q = this.el.searchInput.value;
      if (q.trim().length >= 2) {
        this.performSearch(q);
      }
    });
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
      
      const dayName = thaiDays[now.getDay()];
      const day = now.getDate();
      const month = thaiMonths[now.getMonth()];
      const year = now.getFullYear() + 543;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

      this.el.thaiTime.textContent = `${dayName}ที่ ${day} ${month} ${year} • ${timeStr}`;
    };

    updateTime();
    setInterval(updateTime, 30000);
  }

  renderPresets() {
    this.el.presetsContainer.innerHTML = '';
    
    PRESET_LOCATIONS.forEach(preset => {
      const pill = document.createElement('button');
      pill.className = `preset-pill ${this.isCurrentLocation(preset) ? 'active' : ''}`;
      pill.textContent = preset.name.split(' ')[0] === 'แกรนด์' ? '🏡 Grande Pleno สุขสวัสดิ์' : preset.name;
      pill.title = `${preset.name} (${preset.district}, ${preset.province})`;
      
      pill.addEventListener('click', () => {
        this.selectLocation({
          name: preset.name,
          district: preset.district,
          province: preset.province,
          latitude: preset.latitude,
          longitude: preset.longitude,
          isDefault: preset.name.includes('Grande Pleno')
        });
      });

      this.el.presetsContainer.appendChild(pill);
    });
  }

  isCurrentLocation(loc) {
    if (!this.currentLocation) return false;
    const latDiff = Math.abs(this.currentLocation.latitude - loc.latitude);
    const lonDiff = Math.abs(this.currentLocation.longitude - loc.longitude);
    return latDiff < 0.005 && lonDiff < 0.005;
  }

  async loadData() {
    try {
      this.updateLocationHeader();
      this.renderPresets();

      const [weather, airQuality] = await Promise.all([
        fetchWeatherData(this.currentLocation.latitude, this.currentLocation.longitude),
        fetchAirQualityData(this.currentLocation.latitude, this.currentLocation.longitude)
      ]);

      this.weatherData = weather;
      this.airQualityData = airQuality;

      // Update background ambience animation
      const isDay = weather.current.is_day !== undefined ? weather.current.is_day : 1;
      weatherAnimator.setWeather(weather.current.weather_code, isDay);

      // Render UI components
      this.renderCurrentWeather();
      this.updateLaundrySection();
      this.renderHourlyForecast();
      this.renderDailyForecast();

    } catch (err) {
      console.error('Data loading error:', err);
      this.showToast(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  }

  updateLocationHeader() {
    this.el.locationName.textContent = this.currentLocation.name;
    const sub = [this.currentLocation.district, this.currentLocation.province].filter(Boolean).join(', ');
    this.el.locationSubtext.textContent = sub || 'กรุงเทพมหานคร';

    if (this.currentLocation.name.includes('Grande Pleno') || this.currentLocation.isDefault) {
      this.el.defaultTag.style.display = 'inline-block';
    } else {
      this.el.defaultTag.style.display = 'none';
    }
  }

  renderCurrentWeather() {
    if (!this.weatherData || !this.weatherData.current) return;

    const cur = this.weatherData.current;
    const daily = this.weatherData.daily;
    const isDay = cur.is_day !== undefined ? cur.is_day : 1;
    const weatherInfo = getWeatherInfo(cur.weather_code, isDay);

    // Temperature & Info
    this.el.currentTemp.textContent = Math.round(cur.temperature_2m);
    this.el.currentWeatherIcon.textContent = weatherInfo.displayIcon;
    this.el.weatherWmoTitle.textContent = weatherInfo.label;
    this.el.weatherDetailedDesc.textContent = weatherInfo.displayDesc;

    // Real Feel & Max/Min
    const apparentTemp = cur.apparent_temperature ? Math.round(cur.apparent_temperature) : Math.round(cur.temperature_2m);
    this.el.realFeelPill.textContent = `🌡️ รู้สึกเหมือน: ${apparentTemp}°C`;

    if (daily && daily.temperature_2m_max && daily.temperature_2m_min) {
      const maxT = Math.round(daily.temperature_2m_max[0]);
      const minT = Math.round(daily.temperature_2m_min[0]);
      this.el.tempMaxMinPill.textContent = `🔺 สูงสุด ${maxT}° | 🔻 ต่ำสุด ${minT}°`;
    }

    if (this.el.cloudCoverPill && cur.cloud_cover !== undefined) {
      this.el.cloudCoverPill.textContent = `☁️ เมฆปกคลุม: ${cur.cloud_cover}%`;
    }

    // 1. Rain Chance & Precipitation
    let rainPop = 0;
    const curIdx = this.weatherData.current && this.weatherData.current.time 
      ? this.weatherData.hourly.time.indexOf(this.weatherData.current.time) 
      : 0;
    const safeIdx = curIdx >= 0 ? curIdx : 0;

    if (this.weatherData.hourly && this.weatherData.hourly.precipitation_probability) {
      rainPop = this.weatherData.hourly.precipitation_probability[safeIdx] || 0;
    } else if (daily && daily.precipitation_probability_max) {
      rainPop = daily.precipitation_probability_max[0] || 0;
    }
    this.el.metricRainPop.textContent = rainPop;
    const rainSum = daily && daily.precipitation_sum ? daily.precipitation_sum[0] : (cur.precipitation || 0);
    this.el.metricRainSum.textContent = `ปริมาณฝนสะสม: ${rainSum.toFixed(1)} มม.`;

    // 2. Humidity
    const humidity = cur.relative_humidity_2m || 65;
    this.el.metricHumidity.textContent = humidity;
    if (humidity >= 80) {
      this.el.metricHumidityDesc.textContent = 'ความชื้นสูงมาก เสี่ยงอับชื้น';
      this.el.metricHumidityDesc.className = 'metric-subtext';
    } else if (humidity <= 55) {
      this.el.metricHumidityDesc.textContent = 'อากาศแห้งสบาย ระบายน้ำดี';
      this.el.metricHumidityDesc.className = 'metric-subtext highlight';
    } else {
      this.el.metricHumidityDesc.textContent = 'ความชื้นปานกลาง พอเหมาะ';
      this.el.metricHumidityDesc.className = 'metric-subtext';
    }

    // 3. UV Index
    const uv = cur.uv_index !== undefined ? cur.uv_index : 5;
    this.el.metricUv.textContent = uv.toFixed(1);
    if (uv >= 8) {
      this.el.metricUvDesc.textContent = '☀️ แดดจัดมาก ฆ่าเชื้อดี แห้งไว';
      this.el.metricUvDesc.className = 'metric-subtext highlight';
    } else if (uv >= 5) {
      this.el.metricUvDesc.textContent = '🌤️ แดดปานกลาง เหมาะตากผ้า';
      this.el.metricUvDesc.className = 'metric-subtext highlight';
    } else if (uv >= 3) {
      this.el.metricUvDesc.textContent = '⛅ แดดอ่อน แนะนำตากแดดตรง';
      this.el.metricUvDesc.className = 'metric-subtext';
    } else {
      this.el.metricUvDesc.textContent = '☁️ แดดน้อย / มีเมฆบัง';
      this.el.metricUvDesc.className = 'metric-subtext';
    }

    // 4. Wind
    const windSpeed = cur.wind_speed_10m || 10;
    this.el.metricWind.textContent = windSpeed.toFixed(1);
    const windDirText = getWindDirectionThai(cur.wind_direction_10m || 180);
    this.el.metricWindDir.textContent = `ทิศทาง: ${windDirText}`;

    // 5. PM2.5 Air Quality
    if (this.airQualityData && this.airQualityData.current && this.airQualityData.current.pm2_5 !== undefined) {
      const pm25Val = this.airQualityData.current.pm2_5;
      this.el.metricPm25.textContent = pm25Val.toFixed(1);
      if (pm25Val <= 25) {
        this.el.metricPm25Status.textContent = '🟢 คุณภาพอากาศดีเยี่ยม';
      } else if (pm25Val <= 50) {
        this.el.metricPm25Status.textContent = '🟡 ปานกลาง (ตากผ้าได้)';
      } else {
        this.el.metricPm25Status.textContent = '🔴 ฝุ่นสูง ควรระวังฝุ่นเกาะผ้า';
      }
    } else {
      this.el.metricPm25.textContent = '--';
      this.el.metricPm25Status.textContent = 'ไม่มีข้อมูลเซ็นเซอร์';
    }

    // 6. Sunrise / Sunset
    if (daily && daily.sunrise && daily.sunset) {
      const sunrise = formatThaiTime(daily.sunrise[0]);
      const sunset = formatThaiTime(daily.sunset[0]);
      this.el.metricSunTimes.textContent = `${sunrise} / ${sunset}`;
      this.el.metricSunSub.textContent = '🌅 ขึ้น / 🌇 ตก';
    }
  }

  updateLaundrySection() {
    if (!this.weatherData) return;

    const analysis = calculateLaundryAdvisor(this.weatherData, this.airQualityData, this.selectedFabric);
    if (!analysis) return;

    // Score & Dial Animation
    this.el.laundryScoreNum.textContent = analysis.score;
    const circumference = 2 * Math.PI * 70; // 439.82
    const offset = circumference - (analysis.score / 100) * circumference;
    this.el.scoreDialBar.style.strokeDashoffset = offset;

    // Score Dial Color
    let dialColor = '#10b981';
    if (analysis.score < 35) dialColor = '#ef4444';
    else if (analysis.score < 60) dialColor = '#f59e0b';
    else if (analysis.score < 80) dialColor = '#06b6d4';
    this.el.scoreDialBar.style.stroke = dialColor;

    // Badge & Icon
    this.el.laundryStatusBadge.className = `status-badge ${analysis.badgeClass}`;
    this.el.laundryStatusBadge.textContent = analysis.badgeText;
    this.el.laundryIcon.textContent = analysis.icon;

    // Main Titles
    this.el.laundryMainTitle.textContent = analysis.title;
    this.el.laundryDescription.textContent = analysis.advice;

    // Highlights & Warnings Tags
    this.el.laundryFactorsTags.innerHTML = '';
    analysis.highlights.forEach(h => {
      const tag = document.createElement('span');
      tag.className = 'factor-tag highlight';
      tag.innerHTML = `✓ ${h}`;
      this.el.laundryFactorsTags.appendChild(tag);
    });
    analysis.warnings.forEach(w => {
      const tag = document.createElement('span');
      tag.className = 'factor-tag warning';
      tag.innerHTML = `⚠ ${w}`;
      this.el.laundryFactorsTags.appendChild(tag);
    });

    // Estimated Drying Time Badge
    this.el.estimatedDryingBadge.textContent = `⏱️ คาดว่าแห้งใน: ${analysis.estimatedTimeText}`;

    // Best Window
    this.el.bestWindowText.textContent = `ช่วงเวลาทอง: ${analysis.bestWindow}`;

    // Timeline Strip
    this.el.laundryTimelineStrip.innerHTML = '';
    analysis.hourlySafety.forEach(item => {
      const col = document.createElement('div');
      col.className = `timeline-col ${item.status}`;
      col.innerHTML = `
        <span class="timeline-hour">${item.hourText}</span>
        <span class="timeline-pop">${item.pop}%</span>
        <span class="timeline-status-badge">${item.statusText}</span>
      `;
      col.title = `เวลา ${item.hourText} น. | โอกาสฝน: ${item.pop}% | UV: ${item.uv.toFixed(1)} | ${item.temp.toFixed(0)}°C`;
      this.el.laundryTimelineStrip.appendChild(col);
    });
  }

  renderHourlyForecast() {
    if (!this.weatherData || !this.weatherData.hourly) return;
    const hourly = this.weatherData.hourly;
    this.el.hourlyForecastContainer.innerHTML = '';

    // Locate current hour index in the API array
    const currentIdx = this.weatherData.current && this.weatherData.current.time 
      ? hourly.time.indexOf(this.weatherData.current.time) 
      : 0;
    const startIdx = currentIdx >= 0 ? currentIdx : 0;

    // Show next 24 hours starting from the CURRENT hour
    for (let i = 0; i < Math.min(24, hourly.time.length - startIdx); i++) {
      const idx = startIdx + i;
      const date = new Date(hourly.time[idx]);
      const hourNum = date.getHours();
      const isNow = i === 0;
      const timeLabel = isNow ? 'ขณะนี้' : `${String(hourNum).padStart(2, '0')}:00`;
      const temp = Math.round(hourly.temperature_2m[idx]);
      const isDay = hourly.is_day ? hourly.is_day[idx] : 1;
      const weatherInfo = getWeatherInfo(hourly.weather_code[idx], isDay);
      const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;

      let popClass = 'rain-low';
      if (pop >= 60) popClass = 'rain-high';
      else if (pop >= 30) popClass = 'rain-med';

      const card = document.createElement('div');
      card.className = `hourly-item-card ${isNow ? 'now' : ''}`;
      card.innerHTML = `
        <span class="hourly-time">${timeLabel}</span>
        <span class="hourly-icon">${weatherInfo.displayIcon}</span>
        <span class="hourly-temp">${temp}°</span>
        <span class="hourly-rain-badge ${popClass}">🌧️ ${pop}%</span>
      `;
      card.title = `${timeLabel} - ${weatherInfo.label} (ฝน ${pop}%, ความชื้น ${hourly.relative_humidity_2m ? hourly.relative_humidity_2m[idx] : '--'}%)`;
      this.el.hourlyForecastContainer.appendChild(card);
    }
  }

  renderDailyForecast() {
    if (!this.weatherData || !this.weatherData.daily) return;
    const daily = this.weatherData.daily;
    this.el.dailyForecastContainer.innerHTML = '';

    const minAll = Math.min(...daily.temperature_2m_min);
    const maxAll = Math.max(...daily.temperature_2m_max);
    const tempSpan = Math.max(1, maxAll - minAll);

    for (let i = 0; i < daily.time.length; i++) {
      const dateStr = daily.time[i];
      const thaiDate = formatThaiDateShort(dateStr);
      const isToday = i === 0;
      const dayTitle = isToday ? 'วันนี้' : thaiDate.dayName;
      const subDate = `${thaiDate.dayNumber} ${thaiDate.monthName}`;

      const code = daily.weather_code[i];
      const weatherInfo = getWeatherInfo(code, 1);
      const pop = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
      const minTemp = Math.round(daily.temperature_2m_min[i]);
      const maxTemp = Math.round(daily.temperature_2m_max[i]);

      let laundryBadgeHtml = '';
      if (pop <= 20) {
        laundryBadgeHtml = '<span class="daily-laundry-badge status-excellent">☀️ ตากได้ดีเยี่ยม</span>';
      } else if (pop <= 45) {
        laundryBadgeHtml = '<span class="daily-laundry-badge status-good">⛅ ตากได้ปานกลาง</span>';
      } else if (pop <= 65) {
        laundryBadgeHtml = '<span class="daily-laundry-badge status-caution">⚠️ เสี่ยงฝนตก</span>';
      } else {
        laundryBadgeHtml = '<span class="daily-laundry-badge status-poor">🌧️ เสี่ยงฝนสูงมาก</span>';
      }

      const leftPercent = Math.max(0, ((minTemp - minAll) / tempSpan) * 100);
      const widthPercent = Math.max(10, ((maxTemp - minTemp) / tempSpan) * 100);

      const row = document.createElement('div');
      row.className = 'daily-row';
      row.innerHTML = `
        <div class="daily-day-info">
          <span class="daily-day-name">${dayTitle}</span>
          <span class="daily-date-sub">${subDate}</span>
        </div>
        <div class="daily-icon" title="${weatherInfo.label}">
          ${weatherInfo.icon}
        </div>
        <div class="daily-rain-chance">
          <span>🌧️</span>
          <span>${pop}%</span>
        </div>
        <div class="daily-temp-bar-container">
          <span class="daily-temp-min">${minTemp}°</span>
          <div class="daily-temp-bar-bg">
            <div class="daily-temp-bar-fill" style="margin-left: ${leftPercent}%; width: ${widthPercent}%;"></div>
          </div>
          <span class="daily-temp-max">${maxTemp}°</span>
        </div>
        <div class="daily-laundry-col">
          ${laundryBadgeHtml}
        </div>
      `;

      this.el.dailyForecastContainer.appendChild(row);
    }
  }

  async performSearch(query) {
    try {
      const results = await searchLocations(query);
      this.el.searchDropdown.innerHTML = '';

      if (!results || results.length === 0) {
        this.el.searchDropdown.innerHTML = '<div class="search-item" style="color: var(--text-muted);">ไม่พบผลลัพธ์ที่ค้นหา</div>';
        this.el.searchDropdown.classList.add('show');
        return;
      }

      results.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
          <span>📍 ${loc.name}</span>
          <span class="search-item-district">${[loc.district, loc.province].filter(Boolean).join(', ')}</span>
        `;
        item.addEventListener('click', () => {
          this.selectLocation({
            name: loc.name,
            district: loc.district,
            province: loc.province,
            latitude: loc.latitude,
            longitude: loc.longitude,
            isDefault: false
          });
          this.el.searchInput.value = '';
          this.el.searchDropdown.classList.remove('show');
        });
        this.el.searchDropdown.appendChild(item);
      });

      this.el.searchDropdown.classList.add('show');
    } catch (err) {
      console.warn('Search error:', err);
    }
  }

  selectLocation(location) {
    this.currentLocation = location;
    saveLastLocation(location);
    this.showToast(`เปลี่ยนตำแหน่งเป็น: ${location.name}`);
    this.loadData();
  }

  handleGeolocation() {
    if (!navigator.geolocation) {
      this.showToast('อุปกรณ์ของคุณไม่รองรับระบบระบุตำแหน่ง GPS');
      return;
    }

    this.showToast('กำลังค้นหาพิกัด GPS ปัจจุบันของคุณ...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        this.selectLocation({
          name: 'ตำแหน่งพิกัดของฉัน (GPS)',
          district: 'ตำแหน่งปัจจุบัน',
          province: 'ประเทศไทย',
          latitude: lat,
          longitude: lon,
          isDefault: false
        });
      },
      (err) => {
        console.warn('GPS Error:', err);
        this.showToast('ไม่สามารถระบุตำแหน่ง GPS ได้ กรุณาอนุญาตสิทธิ์เข้าถึงพิกัด');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>💬</span><span>${message}</span>`;
    this.el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WeatherApp();
});
