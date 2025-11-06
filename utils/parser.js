/**
 * WEATHER Command Parser
 * Parses only: WEATHER lat,lng
 * Example: WEATHER -17.83,31.05
 */

class WeatherParser {
  /**
   * Parse WEATHER SMS command
   * @param {string} text - Raw SMS text
   * @returns {Object} - Parsed command object
   */
  parseWeatherCommand(text) {
    try {
      // Normalize text
      const normalizedText = text.trim().toUpperCase().replace(/\s+/g, ' ');
      
      console.log(`🔍 Parsing SMS: "${normalizedText}"`);

      // Check if it starts with WEATHER
      if (!normalizedText.startsWith('WEATHER')) {
        return {
          isValid: false,
          error: 'Command must start with WEATHER'
        };
      }

      // Extract coordinates from text
      const coordinates = this.extractCoordinates(normalizedText);
      
      if (!coordinates.isValid) {
        return {
          isValid: false,
          error: 'Invalid coordinates format'
        };
      }

      return {
        isValid: true,
        lat: coordinates.lat,
        lng: coordinates.lng,
        originalText: text,
        normalizedText: normalizedText
      };

    } catch (error) {
      console.error('❌ SMS parsing error:', error.message);
      return {
        isValid: false,
        error: 'Unable to parse command'
      };
    }
  }

  /**
   * Extract coordinates from WEATHER command
   * @param {string} text - Normalized SMS text
   * @returns {Object} - Coordinates object
   */
  extractCoordinates(text) {
    // Remove "WEATHER" and get the coordinates part
    const coordsPart = text.replace('WEATHER', '').trim();
    
    // Must contain a comma
    if (!coordsPart.includes(',')) {
      return { 
        isValid: false,
        error: 'Coordinates must contain comma' 
      };
    }

    // Look for lat,lng pattern: -17.83,31.05
    const coordRegex = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
    const match = coordsPart.match(coordRegex);

    if (!match) {
      return { 
        isValid: false,
        error: 'Invalid coordinate format' 
      };
    }

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    // Validate that they are valid numbers
    if (isNaN(lat) || isNaN(lng)) {
      return { 
        isValid: false,
        error: 'Coordinates must be valid numbers' 
      };
    }

    // Basic bounds check (global coordinates)
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { 
        isValid: false,
        error: 'Coordinates out of valid range' 
      };
    }

    return {
      isValid: true,
      lat: lat,
      lng: lng,
      raw: coordsPart
    };
  }
}

// Export singleton instance
module.exports = new WeatherParser();
