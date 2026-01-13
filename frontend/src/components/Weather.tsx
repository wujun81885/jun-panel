/**
 * 天气预报组件
 * 使用 Open-Meteo 免费 API（无需 Key，支持 CORS）
 * 支持自定义城市搜索
 */
import { useState, useEffect, useRef } from "react";
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

interface CityOption {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface SavedCity {
  name: string;
  latitude: number;
  longitude: number;
}

const STORAGE_KEY = 'jun-panel-weather-city';

// 默认城市（东京）
const DEFAULT_CITY: SavedCity = {
  name: "东京",
  latitude: 35.6762,
  longitude: 139.6503,
};

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
  const [city, setCity] = useState<SavedCity>(DEFAULT_CITY);
  
  // 城市搜索状态
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityOption[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 加载保存的城市
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCity(JSON.parse(saved));
      } catch {
        setCity(DEFAULT_CITY);
      }
    }
  }, []);

  // 点击外部关闭搜索
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 获取天气数据
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
        );

        if (!response.ok) {
          throw new Error("天气数据获取失败");
        }

        const data = await response.json();
        const current = data.current;
        const weatherCode = current.weather_code || 0;
        const weatherInfo = WEATHER_CODES[weatherCode] || { desc: "未知", icon: "mdi:weather-cloudy" };

        setWeather({
          location: city.name,
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
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  // 搜索城市
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=zh&format=json`
        );
        const data = await response.json();
        if (data.results) {
          setSearchResults(data.results.map((r: any) => ({
            name: r.name,
            country: r.country || "",
            admin1: r.admin1,
            latitude: r.latitude,
            longitude: r.longitude,
          })));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 选择城市
  const handleSelectCity = (option: CityOption) => {
    const newCity: SavedCity = {
      name: option.name,
      latitude: option.latitude,
      longitude: option.longitude,
    };
    setCity(newCity);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCity));
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setIsLoading(true);
  };

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
        <div className="weather-location" ref={searchRef}>
          <button 
            className="weather-location-btn"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="点击更换城市"
          >
            <Icon icon="mdi:map-marker" />
            <span>{weather.location}</span>
            <Icon icon="mdi:chevron-down" className="weather-location-arrow" />
          </button>
          
          {isSearchOpen && (
            <div className="weather-city-search">
              <div className="weather-search-input-wrap">
                <Icon icon="mdi:magnify" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索城市..."
                  autoFocus
                />
                {isSearching && <Icon icon="mdi:loading" className="animate-spin" />}
              </div>
              
              {searchResults.length > 0 && (
                <ul className="weather-search-results">
                  {searchResults.map((r, i) => (
                    <li key={i} onClick={() => handleSelectCity(r)}>
                      <Icon icon="mdi:map-marker-outline" />
                      <span className="city-name">{r.name}</span>
                      <span className="city-region">
                        {r.admin1 ? `${r.admin1}, ` : ""}{r.country}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="weather-no-results">未找到匹配城市</div>
              )}
            </div>
          )}
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
