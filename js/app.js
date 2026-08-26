/**
 * Simplified & Friendly Laundry Advisor App Controller (v2.1.0)
 */

import { 
  DEFAULT_LOCATION, 
  fetchWeatherData, 
  fetchAirQualityData 
} from './api.js';

import { 
  calculateLaundryAdvisor, 
  FABRIC_TYPES 
} from './laundryAdvisor.js';

import { 
  getWeatherInfo, 
  formatThaiDateShort 
} from './weatherIcons.js';

import { weatherAnimator } from './weatherAnim.js';

class WeatherApp {
  constructor() {
    this.location = DEFAULT_LOCATION;
    this.weatherData = null;
    this.airQualityData = null;
    this.selectedFabric = 'normal';

    this.initElements();
    this.initEvents();
    this.loadData();
    this.startClock();
  }

  initElements() {
    this.el = {
      thaiTime: document.getElementById('current-thai-time'),
      btnRefresh: document.getElementById('btn-refresh'),

      // Hero Card
      heroDecisionCard: document.getElementById('hero-decision-card'),
      decisionPill: document.getElementById('decision-pill'),
      heroStatusIcon: document.getElementById('hero-status-icon'),
      heroMainTitle: document.getElementById('hero-main-title'),
      heroAdviceDesc: document.getElementById('hero-advice-desc'),
      estimatedDryingBadge: document.getElementById('estimated-drying-badge'),
      fabricButtonsGroup: document.getElementById('fabric-buttons-group'),

      // 3 Takeaways
      summaryRainText: document.getElementById('summary-rain-text'),
      summarySunWind: document.getElementById('summary-sun-wind'),
      summaryBestWindow: document.getElementById('summary-best-window'),

      // Hourly & Weekly lists
      hourlyForecastContainer: document.getElementById('hourly-forecast-container'),
      dailyForecastContainer: document.getElementById('daily-forecast-container'),

      // Toast
      toastContainer: document.getElementById('toast-container')
    };
  }

  initEvents() {
    // Refresh button
    this.el.btnRefresh.addEventListener('click', () => {
      this.el.btnRefresh.style.transform = 'rotate(360deg)';
      this.showToast('กำลังอัปเดตข้อมูลล่าสุดให้นะคะ...');
      this.loadData();
      setTimeout(() => {
        this.el.btnRefresh.style.transform = 'none';
      }, 700);
    });

    // Fabric selector buttons
    this.el.fabricButtonsGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.cloth-pill');
      if (!btn) return;

      this.el.fabricButtonsGroup.querySelectorAll('.cloth-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.selectedFabric = btn.dataset.fabric;
      this.renderDecision();
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
      
      // Exact Thai 2-digit local time
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes} น.`;

      this.el.thaiTime.textContent = `${dayName}ที่ ${day} ${month} • ${timeStr}`;
    };

    updateTime();
    setInterval(updateTime, 30000);
  }

  async loadData() {
    try {
      const [weather, airQuality] = await Promise.all([
        fetchWeatherData(this.location.latitude, this.location.longitude),
        fetchAirQualityData(this.location.latitude, this.location.longitude)
      ]);

      this.weatherData = weather;
      this.airQualityData = airQuality;

      // Update background dynamic ambient animation
      const isDay = weather.current.is_day !== undefined ? weather.current.is_day : 1;
      weatherAnimator.setWeather(weather.current.weather_code, isDay);

      // Render UI
      this.renderDecision();
      this.renderHourly();
      this.renderWeekly();

    } catch (err) {
      console.error('Data loading error:', err);
      this.showToast('ไม่สามารถโหลดข้อมูลได้ชั่วคราว ลองกดรีเฟรชใหม่อีกครั้งนะคะ');
    }
  }

  renderDecision() {
    if (!this.weatherData) return;

    const analysis = calculateLaundryAdvisor(this.weatherData, this.airQualityData, this.selectedFabric);
    if (!analysis) return;

    // 1. Hero Decision
    this.el.heroStatusIcon.textContent = analysis.heroIcon;
    this.el.heroMainTitle.textContent = analysis.mainDecision;
    this.el.decisionPill.textContent = analysis.decisionBadge;
    this.el.heroAdviceDesc.textContent = analysis.friendlyAdvice;
    this.el.estimatedDryingBadge.textContent = analysis.estimatedDryingText;

    // Decision Pill Color Class
    if (analysis.themeStatus === 'excellent') {
      this.el.decisionPill.style.background = 'rgba(16, 185, 129, 0.2)';
      this.el.decisionPill.style.color = '#34d399';
      this.el.decisionPill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else if (analysis.themeStatus === 'danger') {
      this.el.decisionPill.style.background = 'rgba(239, 68, 68, 0.2)';
      this.el.decisionPill.style.color = '#f87171';
      this.el.decisionPill.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else {
      this.el.decisionPill.style.background = 'rgba(251, 191, 36, 0.2)';
      this.el.decisionPill.style.color = '#fbbf24';
      this.el.decisionPill.style.borderColor = 'rgba(251, 191, 36, 0.4)';
    }

    // 2. 3 Takeaway Cards
    this.el.summaryRainText.textContent = analysis.rainSummaryText;
    this.el.summarySunWind.textContent = analysis.sunAndWindText;
    this.el.summaryBestWindow.textContent = analysis.bestWindow;
  }

  renderHourly() {
    if (!this.weatherData || !this.weatherData.hourly) return;
    const analysis = calculateLaundryAdvisor(this.weatherData, this.airQualityData, this.selectedFabric);
    if (!analysis || !analysis.hourlySafety) return;

    this.el.hourlyForecastContainer.innerHTML = '';

    analysis.hourlySafety.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `simple-hourly-item ${index === 0 ? 'now' : ''}`;

      let popClass = 'low';
      if (item.pop >= 60) popClass = 'high';
      else if (item.pop >= 30) popClass = 'med';

      card.innerHTML = `
        <span class="hourly-time-text">${item.hourText}</span>
        <span class="hourly-icon-emoji">${item.icon}</span>
        <span class="hourly-rain-tag ${popClass}">🌧️ ${item.pop}%</span>
        <span class="hourly-status-tag">${item.statusText}</span>
      `;
      this.el.hourlyForecastContainer.appendChild(card);
    });
  }

  renderWeekly() {
    if (!this.weatherData || !this.weatherData.daily) return;
    const daily = this.weatherData.daily;
    this.el.dailyForecastContainer.innerHTML = '';

    for (let i = 0; i < Math.min(7, daily.time.length); i++) {
      const dateStr = daily.time[i];
      const thaiDate = formatThaiDateShort(dateStr);
      const isToday = i === 0;
      const isTomorrow = i === 1;

      let dayTitle = thaiDate.dayName;
      if (isToday) dayTitle = 'วันนี้';
      else if (isTomorrow) dayTitle = 'พรุ่งนี้';

      const pop = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
      const code = daily.weather_code[i];
      const weatherInfo = getWeatherInfo(code, 1);

      let badgeHtml = '';
      if (pop <= 20) {
        badgeHtml = '<span class="weekly-laundry-badge badge-excellent">☀️ ซักตากได้ดี</span>';
      } else if (pop <= 45) {
        badgeHtml = '<span class="weekly-laundry-badge badge-good">🌤️ ตากได้พอควร</span>';
      } else if (pop <= 65) {
        badgeHtml = '<span class="weekly-laundry-badge badge-caution">⚠️ เสี่ยงฝนบ่าย</span>';
      } else {
        badgeHtml = '<span class="weekly-laundry-badge badge-poor">🌧️ เลี่ยงซักตาก</span>';
      }

      const row = document.createElement('div');
      row.className = 'weekly-row';
      row.innerHTML = `
        <div class="weekly-day-info">
          <span class="weekly-icon">${weatherInfo.icon}</span>
          <div>
            <div class="weekly-day-name">${dayTitle}</div>
            <div class="weekly-date-sub">${thaiDate.dayNumber} ${thaiDate.monthName}</div>
          </div>
        </div>
        <div class="weekly-right-info">
          <span class="weekly-rain-pill">ฝน ${pop}%</span>
          ${badgeHtml}
        </div>
      `;
      this.el.dailyForecastContainer.appendChild(row);
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WeatherApp();
});
