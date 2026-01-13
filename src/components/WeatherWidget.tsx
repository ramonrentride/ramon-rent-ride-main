import { useState, useEffect } from 'react';
import { Cloud, Sun, Thermometer, AlertTriangle, CloudRain, CloudFog, Snowflake, CloudLightning } from 'lucide-react';
import type { WeatherData } from '@/lib/types';

type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'fog' | 'snow' | 'storm' | 'hot';

function getConditionFromCode(code: number): WeatherCondition {
  if (code === 0) return 'sunny';
  if (code >= 1 && code <= 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 95 && code <= 99) return 'storm';
  return 'sunny';
}

function getConditionIcon(condition: WeatherCondition, isHeatwave: boolean) {
  if (isHeatwave) return <Thermometer className="w-6 h-6 text-warning" />;
  
  switch (condition) {
    case 'sunny':
      return <Sun className="w-6 h-6 text-warning" />;
    case 'cloudy':
      return <Cloud className="w-6 h-6 text-muted-foreground" />;
    case 'rain':
      return <CloudRain className="w-6 h-6 text-accent" />;
    case 'fog':
      return <CloudFog className="w-6 h-6 text-muted-foreground" />;
    case 'snow':
      return <Snowflake className="w-6 h-6 text-accent" />;
    case 'storm':
      return <CloudLightning className="w-6 h-6 text-warning" />;
    default:
      return <Sun className="w-6 h-6 text-warning" />;
  }
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 28,
    condition: 'sunny',
    isHeatwave: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Mitzpe Ramon coordinates
        const lat = 30.6103;
        const lon = 34.8019;
        
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia/Jerusalem`
        );
        const data = await response.json();
        
        const temp = Math.round(data.current.temperature_2m);
        const weatherCode = data.current.weather_code;
        const condition = getConditionFromCode(weatherCode);
        
        setWeather({
          temperature: temp,
          condition: condition,
          isHeatwave: temp > 35,
        });
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Update every 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`glass-card rounded-xl p-4 flex items-center gap-3 ${
      weather.isHeatwave ? 'border-warning/50 bg-warning/10' : ''
    }`}>
      <div className={`p-2 rounded-full ${
        weather.isHeatwave ? 'bg-warning/20' : 'bg-accent/20'
      }`}>
        {getConditionIcon(weather.condition as WeatherCondition, weather.isHeatwave)}
      </div>
      
      <div className="flex-1">
        <div className="text-2xl font-bold text-foreground">
          {loading ? '...' : `${weather.temperature}°C`}
        </div>
        <div className="text-sm text-muted-foreground">
          מכתש רמון
        </div>
      </div>

      {weather.isHeatwave && (
        <div className="flex items-center gap-1 text-warning text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          <span>גל חום!</span>
        </div>
      )}
    </div>
  );
}
