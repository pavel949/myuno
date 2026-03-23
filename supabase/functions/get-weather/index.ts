// Deno.serve used (native edge runtime)
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

import { getCorsHeaders } from "../_shared/cors.ts";

// Phuket coordinates
const PHUKET_LAT = 7.8804;
const PHUKET_LON = 98.3923;

// WMO Weather codes mapping
const weatherCodeMap: Record<number, { condition: 'sunny' | 'cloudy' | 'rainy'; description: string; descriptionRu: string }> = {
  0: { condition: 'sunny', description: 'Clear sky', descriptionRu: 'Ясное небо' },
  1: { condition: 'sunny', description: 'Mainly clear', descriptionRu: 'Преимущественно ясно' },
  2: { condition: 'cloudy', description: 'Partly cloudy', descriptionRu: 'Переменная облачность' },
  3: { condition: 'cloudy', description: 'Overcast', descriptionRu: 'Пасмурно' },
  45: { condition: 'cloudy', description: 'Foggy', descriptionRu: 'Туман' },
  48: { condition: 'cloudy', description: 'Depositing rime fog', descriptionRu: 'Туман с изморозью' },
  51: { condition: 'rainy', description: 'Light drizzle', descriptionRu: 'Лёгкая морось' },
  53: { condition: 'rainy', description: 'Moderate drizzle', descriptionRu: 'Умеренная морось' },
  55: { condition: 'rainy', description: 'Dense drizzle', descriptionRu: 'Сильная морось' },
  61: { condition: 'rainy', description: 'Light rain', descriptionRu: 'Небольшой дождь' },
  63: { condition: 'rainy', description: 'Moderate rain', descriptionRu: 'Умеренный дождь' },
  65: { condition: 'rainy', description: 'Heavy rain', descriptionRu: 'Сильный дождь' },
  66: { condition: 'rainy', description: 'Freezing rain', descriptionRu: 'Ледяной дождь' },
  67: { condition: 'rainy', description: 'Heavy freezing rain', descriptionRu: 'Сильный ледяной дождь' },
  71: { condition: 'cloudy', description: 'Light snow', descriptionRu: 'Небольшой снег' },
  73: { condition: 'cloudy', description: 'Moderate snow', descriptionRu: 'Умеренный снег' },
  75: { condition: 'cloudy', description: 'Heavy snow', descriptionRu: 'Сильный снег' },
  77: { condition: 'cloudy', description: 'Snow grains', descriptionRu: 'Снежная крупа' },
  80: { condition: 'rainy', description: 'Light rain showers', descriptionRu: 'Небольшой ливень' },
  81: { condition: 'rainy', description: 'Moderate rain showers', descriptionRu: 'Умеренный ливень' },
  82: { condition: 'rainy', description: 'Violent rain showers', descriptionRu: 'Сильный ливень' },
  85: { condition: 'cloudy', description: 'Light snow showers', descriptionRu: 'Небольшой снегопад' },
  86: { condition: 'cloudy', description: 'Heavy snow showers', descriptionRu: 'Сильный снегопад' },
  95: { condition: 'rainy', description: 'Thunderstorm', descriptionRu: 'Гроза' },
  96: { condition: 'rainy', description: 'Thunderstorm with hail', descriptionRu: 'Гроза с градом' },
  99: { condition: 'rainy', description: 'Thunderstorm with heavy hail', descriptionRu: 'Гроза с сильным градом' },
};

function getWeatherInfo(code: number): { condition: 'sunny' | 'cloudy' | 'rainy'; description: string; descriptionRu: string } {
  return weatherCodeMap[code] || weatherCodeMap[0];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - public read endpoints (100/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'get-weather',
      RATE_LIMITS.publicRead,
      corsHeaders
    );
    if (rateLimitResponse) return rateLimitResponse;

    console.log('Fetching weather data for Phuket...');
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${PHUKET_LAT}&longitude=${PHUKET_LON}&current=temperature_2m,weather_code&timezone=Asia/Bangkok`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Open-Meteo response:', JSON.stringify(data.current));
    
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const weather = getWeatherInfo(code);

    const result = {
      temp,
      condition: weather.condition,
      description: weather.description,
      descriptionRu: weather.descriptionRu,
      updatedAt: new Date().toISOString(),
    };

    console.log('Returning weather data:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800', // 30 min cache
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Weather API error:', errorMessage);
    
    // Return fallback data on error
    return new Response(JSON.stringify({ 
      error: errorMessage,
      // Fallback data so the widget still works
      temp: 31,
      condition: 'sunny',
      description: 'Weather data unavailable',
      descriptionRu: 'Данные о погоде недоступны',
    }), {
      status: 200, // Return 200 with fallback so UI doesn't break
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
      },
    });
  }
});
