/**
 * SMS Response Formatter
 * Formats API responses into concise SMS messages (<150 chars)
 */

class SMSFormatter {
  /**
   * Format weather response for SMS
   * @param {Object} weatherData - Weather data from Flask API
   * @returns {string} - Formatted SMS message
   */
  formatWeatherResponse(weatherData) {
    try {
      if (!weatherData) {
        return 'Weather data unavailable. Try again later.';
      }

      const { 
        temperature, 
        humidity, 
        rainfall, 
        conditions,
        forecast 
      } = weatherData;

      let message = '';

      // Current conditions
      if (temperature && humidity) {
        message += `${Math.round(temperature)}°C, ${Math.round(humidity)}% humidity`;
      }

      // Rainfall
      if (rainfall !== undefined) {
        if (rainfall > 0) {
          message += `, ${rainfall}mm rain`;
        } else {
          message += ', dry';
        }
      }

      // Brief forecast if available
      if (forecast && forecast.summary) {
        message += `. ${forecast.summary.substring(0, 30)}`;
      }

      // Add location context if available
      if (weatherData.location) {
        message += ` (${weatherData.location})`;
      }

      return this.truncateMessage(message) || 'Weather data available. Check conditions.';

    } catch (error) {
      console.error('❌ Weather formatting error:', error.message);
      return 'Weather data format error. Contact support.';
    }
  }

  /**
   * Format insurance quote response for SMS
   * @param {Object} quoteData - Quote data from Flask API
   * @param {string} crop - Crop type
   * @returns {string} - Formatted SMS message
   */
  formatQuoteResponse(quoteData, crop) {
    try {
      if (!quoteData || !quoteData.premium) {
        return `${crop} insurance quote unavailable. Try again.`;
      }

      const {
        premium,
        coverage,
        risk_level,
        valid_until,
        currency = 'USD'
      } = quoteData;

      let message = `${crop} Insurance: `;
      
      // Premium and coverage
      if (coverage) {
        message += `${currency}${premium}/${currency}${coverage}`;
      } else {
        message += `${currency}${premium} premium`;
      }

      // Risk level
      if (risk_level) {
        const risk = risk_level.toLowerCase();
        if (risk === 'low') message += ' (Low Risk)';
        else if (risk === 'medium') message += ' (Med Risk)';
        else if (risk === 'high') message += ' (High Risk)';
      }

      // Validity
      if (valid_until) {
        const validDate = new Date(valid_until);
        const days = Math.ceil((validDate - new Date()) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          message += ` Valid ${days}d`;
        }
      }

      return this.truncateMessage(message);

    } catch (error) {
      console.error('❌ Quote formatting error:', error.message);
      return `${crop} quote error. Contact support for assistance.`;
    }
  }

  /**
   * Format planting window response for SMS
   * @param {Object} plantingData - Planting data from Flask API
   * @returns {string} - Formatted SMS message
   */
  formatPlantingResponse(plantingData) {
    try {
      if (!plantingData) {
        return 'Planting window data unavailable. Try again.';
      }

      const {
        optimal_start,
        optimal_end,
        risk_level,
        rainfall_outlook,
        recommendation
      } = plantingData;

      let message = 'Planting: ';

      // Optimal window
      if (optimal_start && optimal_end) {
        const start = new Date(optimal_start);
        const end = new Date(optimal_end);
        const startMonth = start.toLocaleDateString('en', { month: 'short' });
        const endMonth = end.toLocaleDateString('en', { month: 'short' });
        
        if (startMonth === endMonth) {
          message += `${startMonth} ${start.getDate()}-${end.getDate()}`;
        } else {
          message += `${startMonth} ${start.getDate()}-${endMonth} ${end.getDate()}`;
        }
      }

      // Risk and outlook
      if (risk_level) {
        const risk = risk_level.toLowerCase();
        if (risk === 'optimal') message += ' (Optimal)';
        else if (risk === 'good') message += ' (Good)';
        else if (risk === 'fair') message += ' (Fair)';
        else if (risk === 'poor') message += ' (Poor)';
      }

      // Brief recommendation
      if (recommendation && recommendation.length < 50) {
        message += `. ${recommendation}`;
      } else if (rainfall_outlook) {
        const outlook = rainfall_outlook.toLowerCase();
        if (outlook.includes('above')) message += '. Good rains expected';
        else if (outlook.includes('below')) message += '. Low rains expected';
        else if (outlook.includes('normal')) message += '. Normal rains expected';
      }

      return this.truncateMessage(message);

    } catch (error) {
      console.error('❌ Planting formatting error:', error.message);
      return 'Planting window error. Contact support.';
    }
  }

  /**
   * Format help message
   * @returns {string} - Help message
   */
  formatHelpMessage() {
    return 'Yieldera SMS Commands:\n' +
           'WEATHER -18.4,30.8\n' +
           'QUOTE MAIZE -18.4,30.8\n' +
           'PLANTING -18.4,30.8\n' +
           'Replace coords with your location.';
  }

  /**
   * Format error message
   * @returns {string} - Error message
   */
  formatErrorMessage() {
    return 'Service temporarily unavailable. Please try again in a few minutes or contact support.';
  }

  /**
   * Format NDVI/vegetation response for SMS
   * @param {Object} ndviData - NDVI data from Flask API
   * @returns {string} - Formatted SMS message
   */
  formatNDVIResponse(ndviData) {
    try {
      if (!ndviData || ndviData.ndvi === undefined) {
        return 'Vegetation data unavailable. Try again later.';
      }

      const { ndvi, health_status, change_trend } = ndviData;

      let message = `Vegetation: `;

      // NDVI value and health
      if (health_status) {
        const health = health_status.toLowerCase();
        if (health === 'excellent') message += 'Excellent';
        else if (health === 'good') message += 'Good';  
        else if (health === 'fair') message += 'Fair';
        else if (health === 'poor') message += 'Poor';
        else if (health === 'stressed') message += 'Stressed';
      } else {
        message += `NDVI ${ndvi.toFixed(2)}`;
      }

      // Trend
      if (change_trend) {
        const trend = change_trend.toLowerCase();
        if (trend === 'improving') message += ' (Improving)';
        else if (trend === 'declining') message += ' (Declining)';
        else if (trend === 'stable') message += ' (Stable)';
      }

      return this.truncateMessage(message);

    } catch (error) {
      console.error('❌ NDVI formatting error:', error.message);
      return 'Vegetation data error. Contact support.';
    }
  }

  /**
   * Format drought risk response for SMS
   * @param {Object} droughtData - Drought data from Flask API
   * @returns {string} - Formatted SMS message
   */
  formatDroughtResponse(droughtData) {
    try {
      if (!droughtData) {
        return 'Drought risk data unavailable. Try again.';
      }

      const { risk_level, severity, outlook, recommendation } = droughtData;

      let message = 'Drought Risk: ';

      // Risk level
      if (risk_level) {
        const risk = risk_level.toLowerCase();
        if (risk === 'low') message += 'Low';
        else if (risk === 'moderate') message += 'Moderate';  
        else if (risk === 'high') message += 'High';
        else if (risk === 'severe') message += 'Severe';
      }

      // Outlook
      if (outlook) {
        const out = outlook.toLowerCase();
        if (out.includes('improving')) message += ' (Improving)';
        else if (out.includes('worsening')) message += ' (Worsening)';
        else if (out.includes('stable')) message += ' (Stable)';
      }

      // Brief recommendation
      if (recommendation && recommendation.length < 40) {
        message += `. ${recommendation}`;
      }

      return this.truncateMessage(message);

    } catch (error) {
      console.error('❌ Drought formatting error:', error.message);
      return 'Drought risk error. Contact support.';
    }
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
   * Format currency amount
   * @param {number} amount - Amount
   * @param {string} currency - Currency code
   * @returns {string} - Formatted amount
   */
  formatCurrency(amount, currency = 'USD') {
    if (currency === 'USD') return `$${amount}`;
    if (currency === 'ZWL') return `Z$${amount}`;
    if (currency === 'BWP') return `P${amount}`;
    if (currency === 'ZMW') return `K${amount}`;
    if (currency === 'TZS') return `TSh${amount}`;
    if (currency === 'MWK') return `MK${amount}`;
    
    return `${currency}${amount}`;
  }
}

// Export singleton instance
module.exports = new SMSFormatter();
