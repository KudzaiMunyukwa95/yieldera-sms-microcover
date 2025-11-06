/**
 * Weather SMS Response Formatter
 * Formats weather data into exact specified SMS format
 */

class WeatherFormatter {
  /**
   * Format weather response for SMS
   * @param {Object} weatherData - Weather data from Open-Meteo
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {string} - Formatted SMS message
   */
  formatWeatherResponse(weatherData, lat, lng) {
    try {
      if (!weatherData) {
        return 'Weather temporarily unavailable. Try again.';
      }

      const { temperature, windspeed, rain, humidity, weathercode } = weatherData;

      // Format the exact response as specified
      const response = `Weather for ${lat}, ${lng}:
Temp: ${Math.round(temperature || 0)}°C
Rain: ${Math.round((rain || 0) * 10) / 10} mm
Wind: ${Math.round(windspeed || 0)} km/h
Humidity: ${Math.round(humidity || 0)}%`;

      return response;

    } catch (error) {
      console.error('❌ Weather formatting error:', error.message);
      return 'Weather temporarily unavailable. Try again.';
    }
  }
}

// Export singleton instance
module.exports = new WeatherFormatter();
