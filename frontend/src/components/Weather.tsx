/**
 * 天气预报组件
 * 使用 Open-Meteo 免费 API（无需 Key，支持 CORS）
 */
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./Weather.css";

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

// 重庆坐标
const CHONGQING_LAT = 29.5628;
const CHONGQING_LON = 106.5528;

// 天气代码映射
const WEATHER_CODES: Record<number, { desc: string; icon: string }> = {
  0: { desc: "晴朗", icon: "mdi:weather-sunny" },
  1: { desc: "大部晴朗", icon: "mdi:weather-sunny" },
  2: { desc: "多云", icon: "mdi:weather-partly-cloudy" },
  3: { desc: "阴天", icon: "mdi:weather-cloudy" },
  45: { desc: "雾", icon: "mdi:weather-fog" },
  48: { desc: "雾凇", icon: "mdi:weather-fog" },
  51: { desc: "小毛毛雨", icon: "mdi:weather-rainy" },
  53: { desc: "毛毛雨", icon: "mdi:weather-rainy" },
  55: { desc: "大毛毛雨", icon: "mdi:weather-rainy" },
  61: { desc: "小雨", icon: "mdi:weather-rainy" },
  63: { desc: "中雨", icon: "mdi:weather-pouring" },
  65: { desc: "大雨", icon: "mdi:weather-pouring" },
  71: { desc: "小雪", icon: "mdi:weather-snowy" },
  73: { desc: "中雪", icon: "mdi:weather-snowy" },
  75: { desc: "大雪", icon: "mdi:weather-snowy-heavy" },
  80: { desc: "阵雨", icon: "mdi:weather-pouring" },
  81: { desc: "中阵雨", icon: "mdi:weather-pouring" },
  82: { desc: "大阵雨", icon: "mdi:weather-pouring" },
  95: { desc: "雷暴", icon: "mdi:weather-lightning" },
  96: { desc: "雷暴冰雹", icon: "mdi:weather-lightning-rainy" },
  99: { desc: "大雷暴冰雹", icon: "mdi:weather-lightning-rainy" },
};

export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 使用 Open-Meteo API（免费，无需 API Key，支持 CORS）
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${CHONGQING_LAT}&longitude=${CHONGQING_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai`
        );

        if (!response.ok) {
          throw new Error("天气数据获取失败");
        }

        const data = await response.json();
        const current = data.current;
        const weatherCode = current.weather_code || 0;
        const weatherInfo = WEATHER_CODES[weatherCode] || { desc: "未知", icon: "mdi:weather-cloudy" };

        setWeather({
          location: "重庆",
          temperature: Math.round(current.temperature_2m),
          description: weatherInfo.desc,
          icon: weatherInfo.icon,
          humidity: Math.round(current.relative_humidity_2m),
          windSpeed: Math.round(current.wind_speed_10m),
        });
        setError(null);
      } catch (err) {
        console.error("获取天气失败:", err);
        setError("无法获取天气数据");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();

    // 每 30 分钟刷新一次
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="weather-widget glass-card">
        <div className="weather-loading">
          <Icon icon="mdi:loading" className="animate-spin" />
          <span>加载天气...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="weather-widget glass-card">
        <div className="weather-error">
          <Icon icon="mdi:weather-cloudy-alert" />
          <span>{error || "天气数据不可用"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-widget glass-card">
      <div className="weather-main">
        <Icon icon={weather.icon} className="weather-icon" />
        <div className="weather-temp">
          <span className="temp-value">{weather.temperature}</span>
          <span className="temp-unit">°C</span>
        </div>
      </div>

      <div className="weather-info">
        <div className="weather-location">
          <Icon icon="mdi:map-marker" />
          <span>{weather.location}</span>
        </div>
        <div className="weather-desc">{weather.description}</div>
      </div>

      <div className="weather-details">
        <div className="weather-detail-item">
          <Icon icon="mdi:water-percent" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="weather-detail-item">
          <Icon icon="mdi:weather-windy" />
          <span>{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}

export default Weather;
