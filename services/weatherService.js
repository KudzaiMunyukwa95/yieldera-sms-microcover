const axios = require('axios');

class WeatherService {
  constructor() {
    this.baseURL = process.env.WEATHER_BASE || 'https://api.open-meteo.com';
    this.timeout = 15000; // 15 seconds
    
    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Yieldera-Weather-SMS/2.0'
      }
    });

    // Add logging interceptors
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🌐 Weather API Request: ${config.url}`);
        return config;
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ Weather API Response: ${response.status}`);
        return response;
      },
      (error) => {
        console.error(`❌ Weather API Error: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get current weather conditions
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Current weather data
   */
  async getCurrentWeather(lat, lng) {
    try {
      const response = await this.api.get('/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m',
          timezone: 'auto'
        }
      });

      const current = response.data.current;
      
      return {
        temperature: Math.round(current.temperature_2m),
        precipitation: current.precipitation || 0,
        wind_speed: Math.round(current.wind_speed_10m),
        humidity: Math.round(current.relative_humidity_2m),
        timestamp: current.time,
        units: response.data.current_units
      };

    } catch (error) {
      console.error('❌ Current weather API error:', error.message);
      throw new Error('Failed to fetch current weather');
    }
  }

  /**
   * Get 7-day weather forecast
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Forecast data
   */
  async getForecast(lat, lng) {
    try {
      const response = await this.api.get('/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
          forecast_days: 7,
          timezone: 'auto'
        }
      });

      const daily = response.data.daily;
      
      return {
        dates: daily.time,
        max_temps: daily.temperature_2m_max.map(temp => Math.round(temp)),
        min_temps: daily.temperature_2m_min.map(temp => Math.round(temp)),
        precipitation: daily.precipitation_sum.map(rain => Math.round(rain * 10) / 10),
        rain_probability: daily.precipitation_probability_max,
        units: response.data.daily_units
      };

    } catch (error) {
      console.error('❌ Forecast API error:', error.message);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  /**
   * Get 7-day rainfall history
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Historical rainfall data
   */
  async getRainHistory(lat, lng) {
    try {
      const response = await this.api.get('/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          daily: 'precipitation_sum',
          past_days: 7,
          timezone: 'auto'
        }
      });

      const daily = response.data.daily;
      
      return {
        dates: daily.time,
        precipitation: daily.precipitation_sum.map(rain => Math.round(rain * 10) / 10),
        total: daily.precipitation_sum.reduce((sum, rain) => sum + rain, 0),
        units: response.data.daily_units
      };

    } catch (error) {
      console.error('❌ Rain history API error:', error.message);
      throw new Error('Failed to fetch rainfall history');
    }
  }

  /**
   * Validate coordinates for Africa region
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} - True if valid for Africa
   */
  isValidAfricanCoordinates(lat, lng) {
    // Rough bounds for Africa
    return lat >= -35 && lat <= 37 && lng >= -20 && lng <= 55;
  }

  /**
   * Health check for Open-Meteo API
   * @returns {Promise<boolean>} - True if API is accessible
   */
  async healthCheck() {
    try {
      // Test with Cape Town coordinates
      await this.getCurrentWeather(-33.9, 18.4);
      return true;
    } catch (error) {
      console.error('❌ Weather API health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new WeatherService();
