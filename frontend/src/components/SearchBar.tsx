/**
 * 搜索框组件
 * 支持多种搜索引擎切换
 */
import { useState, type FormEvent } from 'react';
import { Icon } from '@iconify/react';
import './SearchBar.css';

interface SearchEngine {
  id: string;
  name: string;
  icon: string;
  url: string;
}

const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', icon: 'mdi:google', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', icon: 'mdi:microsoft-bing', url: 'https://www.bing.com/search?q=' },
  { id: 'baidu', name: '百度', icon: 'simple-icons:baidu', url: 'https://www.baidu.com/s?wd=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', icon: 'simple-icons:duckduckgo', url: 'https://duckduckgo.com/?q=' },
];

interface SearchBarProps {
  defaultEngine?: string;
  onSearch?: (query: string, engine: string) => void;
}

export function SearchBar({ defaultEngine = 'google', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [currentEngine, setCurrentEngine] = useState(
    SEARCH_ENGINES.find(e => e.id === defaultEngine) || SEARCH_ENGINES[0]
  );
  const [showEngines, setShowEngines] = useState(false);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    if (onSearch) {
      onSearch(query, currentEngine.id);
    }
    
    // 打开搜索页面
    window.open(currentEngine.url + encodeURIComponent(query), '_blank');
  };
  
  const handleEngineSelect = (engine: SearchEngine) => {
    setCurrentEngine(engine);
    setShowEngines(false);
  };
  
  return (
    <div className="search-bar glass-card">
      <form onSubmit={handleSubmit} className="search-form">
        <button 
          type="button" 
          className="search-engine-btn"
          onClick={() => setShowEngines(!showEngines)}
        >
          <Icon icon={currentEngine.icon} />
        </button>
        
        <input
          type="text"
          className="search-input"
          placeholder={`使用 ${currentEngine.name} 搜索...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        <button type="submit" className="search-submit-btn">
          <Icon icon="mdi:magnify" />
        </button>
      </form>
      
      {/* 搜索引擎选择器 */}
      {showEngines && (
        <div className="search-engines-dropdown">
          {SEARCH_ENGINES.map((engine) => (
            <button
              key={engine.id}
              className={`search-engine-option ${engine.id === currentEngine.id ? 'active' : ''}`}
              onClick={() => handleEngineSelect(engine)}
            >
              <Icon icon={engine.icon} />
              <span>{engine.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
