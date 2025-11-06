/**
 * Weather SMS Response Formatter
 * Formats weather data into SMS messages (<150 chars)
 */

class WeatherFormatter {
  /**
   * Format current weather for SMS
   * @param {Object} weatherData - Current weather data
   * @returns {string} - Formatted SMS message
   */
  formatCurrentWeather(weatherData) {
    try {
      if (!weatherData) {
        return 'Weather data unavailable. Try again.';
      }

      const { temperature, precipitation, wind_speed, humidity } = weatherData;

      let message = `Current: ${temperature}°C`;
      
      if (precipitation > 0) {
        message += `, rain ${precipitation}mm`;
      } else {
        message += ', dry';
      }
      
      if (wind_speed) {
        message += `, wind ${wind_speed}km/h`;
      }

      if (humidity) {
        message += `, ${humidity}% humidity`;
      }

      message += '.';

      return this.truncateMessage(message);

    } catch (error) {
      console.error('❌ Current weather formatting error:', error.message);
      return 'Weather format error. Try again.';
    }
  }

  /**
   * Format 7-day forecast for SMS
   * @param {Object} forecastData - Forecast data
   * @returns {string} - Formatted SMS message
   */
  formatForecast(forecastData) {
    try {
      if (!forecastData || !forecastData.dates) {
        return 'Forecast unavailable. Try again.';
      }

      const { dates, precipitation, max_temps } = forecastData;

      let message = '7-day forecast: ';
      let dailyForecasts = [];

      for (let i = 0; i < Math.min(7, dates.length); i++) {
        const date = new Date(dates[i]);
        const dayName = this.getDayName(date, i);
        const rain = Math.round(precipitation[i] || 0);
        const temp = Math.round(max_temps[i] || 0);

        if (rain > 0) {
          dailyForecasts.push(`${dayName} ${rain}mm/${temp}°C`);
        } else {
          dailyForecasts.push(`${dayName} dry/${temp}°C`);
        }
      }

      // Take first 3-4 days to fit in SMS
      const maxDays = Math.min(4, dailyForecasts.length);
      message += dailyForecasts.slice(0, maxDays).join(', ');

      if (dailyForecasts.length > maxDays) {
        message += '...';
      }

      return this.truncateMessage(message);

    } catch (error) {
      console.error('❌ Forecast formatting error:', error.message);
      return 'Forecast format error. Try again.';
    }
  }

  /**
   * Format rainfall history for SMS
   * @param {Object} historyData - Historical rainfall data
   * @returns {string} - Formatted SMS message
   */
  formatRainHistory(historyData) {
    try {
      if (!historyData || !historyData.precipitation) {
        return 'Rainfall history unavailable. Try again.';
      }

      const { precipitation, total } = historyData;
      const totalRain = Math.round((total || 0) * 10) / 10;

      let message = `Last 7 days rainfall: ${totalRain}mm total. `;

      // Find days with significant rainfall (>1mm)
      const rainDays = precipitation
        .map((rain, index) => ({ day: index + 1, amount: Math.round(rain * 10) / 10 }))
        .filter(day => day.amount > 1)
        .slice(-3); // Last 3 rain days

      if (rainDays.length > 0) {
        const rainSummary = rainDays
          .map(day => `Day ${day.day}: ${day.amount}mm`)
          .join(', ');
        message += rainSummary;
      } else {
        message += 'Mostly dry period.';
      }

      return this.truncateMessage(message);

    } catch (error) {
      console.error('❌ Rain history formatting error:', error.message);
      return 'Rain history format error. Try again.';
    }
  }

  /**
   * Format help message
   * @returns {string} - Help message
   */
  formatHelpMessage() {
    return 'Weather SMS Commands:\n' +
           'WEATHER lat,lng - Current conditions\n' +
           'FORECAST lat,lng - 7-day forecast\n' +
           'RAINHISTORY lat,lng - Past 7 days rain\n' +
           'Example: WEATHER -18.4,30.8';
  }

  /**
   * Format error message
   * @returns {string} - Error message
   */
  formatErrorMessage() {
    return 'Service error. Try again later or send HELP for commands.';
  }

  /**
   * Get day name for forecast
   * @param {Date} date - Date object
   * @param {number} index - Day index (0 = today)
   * @returns {string} - Day name
   */
  getDayName(date, index) {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  /**
   * Truncate message to SMS limits
   * @param {string} message - Original message
   * @param {number} maxLength - Maximum length (default 150)
   * @returns {string} - Truncated message
   */
  truncateMessage(message, maxLength = 150) {
    if (!message) return '';
    
    if (message.length <= maxLength) {
      return message;
    }

    // Try to truncate at word boundary
    const truncated = message.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Format temperature with units
   * @param {number} temp - Temperature value
   * @param {string} unit - Temperature unit
   * @returns {string} - Formatted temperature
   */
  formatTemperature(temp, unit = '°C') {
    if (temp === null || temp === undefined) return 'N/A';
    return `${Math.round(temp)}${unit}`;
  }

  /**
   * Format precipitation with units
   * @param {number} rain - Precipitation value
   * @param {string} unit - Precipitation unit
   * @returns {string} - Formatted precipitation
   */
  formatPrecipitation(rain, unit = 'mm') {
    if (rain === null || rain === undefined) return '0mm';
    const rounded = Math.round(rain * 10) / 10;
    return `${rounded}${unit}`;
  }

  /**
   * Format wind speed with units
   * @param {number} wind - Wind speed value
   * @param {string} unit - Wind speed unit
   * @returns {string} - Formatted wind speed
   */
  formatWindSpeed(wind, unit = 'km/h') {
    if (wind === null || wind === undefined) return 'N/A';
    return `${Math.round(wind)}${unit}`;
  }
}

// Export singleton instance
module.exports = new WeatherFormatter();
