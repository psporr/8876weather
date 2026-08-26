# 🧺🌤️ พยากรณ์อากาศและดัชนีตากผ้า (Thai Weather & Laundry Advisory App)

เว็บแอปพลิเคชันพยากรณ์อากาศภาษาไทยแบบเรียลไทม์ พร้อมระบบวิเคราะห์ความเหมาะสมในการซักผ้าและตากผ้ากลางแจ้ง (**Smart Laundry Index**) สำหรับพื้นที่ **Grande Pleno สุขสวัสดิ์ - พระราม 3** (เขตทุ่งครุ/บางมด, กรุงเทพฯ) และทุกพื้นที่ทั่วไทย

🔗 **Live Demo (GitHub Pages):** [https://psporr.github.io/8876weather/](https://psporr.github.io/8876weather/)

---

## 🌟 ฟีเจอร์เด่น (Key Features)

- 🧺 **ดัชนีตากผ้าอัจฉริยะ (Laundry Advisor)**:
  - คำนวณคะแนนความเหมาะสมในการตากผ้า (0 - 100 คะแนน)
  - วิเคราะห์โอกาสฝนตก (Precipitation Probability), ความเข้มแสงแดด UV, ความชื้นสัมพัทธ์, ความเร็วลม และค่าฝุ่น PM2.5
  - คำนวณระยะเวลาผ้าแห้งโดยประมาณแยกตามประเภทเนื้อผ้า (ผ้าบาง, ผ้าทั่วไป, ผ้าหนา/ยีนส์, ผ้านวม/ผ้าปูที่นอน)
  - ระบุ **ช่วงเวลาทองในการตากผ้า (Best Drying Window)** และไทม์ไลน์ความปลอดภัยรายชั่วโมง 12 ชม.
- 🌧️ **พยากรณ์ฝนและสภาพอากาศ**:
  - อุณหภูมิปัจจุบัน และ RealFeel (°C)
  - พยากรณ์รายชั่วโมง 24 ชม. พร้อม Badge โอกาสฝนตก
  - พยากรณ์ล่วงหน้า 7 วัน พร้อมแถบช่วงอุณหภูมิต่ำสุด-สูงสุด
  - ดัชนีตรวจวัดสภาพอากาศ 6 ด้าน (ฝน, ความชื้น, UV, ลม, PM2.5, พระอาทิตย์ขึ้น-ตก)
- 🏡 **พิกัดและตำแหน่งที่ตั้ง**:
  - พิกัดเริ่มต้น: **Grande Pleno สุขสวัสดิ์ - พระราม 3**
  - ปุ่มลัดเปลี่ยนทำเลใกล้เคียง (พระราม 3, ราษฎร์บูรณะ, พระประแดง, สยาม/สาทร, บางนา, จตุจักร)
  - ค้นหาพิกัดภาษาไทยแบบ Live Autocomplete
  - ปุ่มระบุตำแหน่งพิกัดปัจจุบันผ่าน GPS
- 🎨 **ดีไซน์ระดับพรีเมียม**:
  - สไตล์ Glassmorphism และ Responsive รองรับทุกหน้าจอ
  - Animated Dynamic Canvas เปลี่ยนพื้นหลังตามสภาพอากาศจริง (แดดออก, เมฆลอย, สายฝนเรียลไทม์, ท้องฟ้ายามค่ำคืน)

---

## 🛠️ ข้อมูลและเทคโนโลยี

- **Weather & Rain API:** [Open-Meteo](https://open-meteo.com/) (Forecast & Air Quality API)
- **Frontend:** Vanilla HTML5, Modern CSS3 (Glassmorphism, Animations), Vanilla JavaScript (ES6 Modules)
- **Typography:** Google Fonts (`Prompt`, `Kanit`, `Inter`)
- **Hosting:** GitHub Pages

---

## 🚀 การเปิดใช้งานในเครื่อง (Local Setup)

```bash
# Clone the repository
git clone https://github.com/psporr/8876weather.git
cd 8876weather

# Start a local web server
python -m http.server 3000
# or
npx serve .
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
