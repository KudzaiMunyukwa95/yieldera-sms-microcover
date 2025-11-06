/**
 * Weather SMS Command Parser
 * Parses: WEATHER, FORECAST, RAINHISTORY, HELP commands
 */

class WeatherParser {
  /**
   * Parse weather SMS command
   * @param {string} text - Raw SMS text
   * @returns {Object} - Parsed command object
   */
  parseWeatherCommand(text) {
    try {
      // Normalize text
      const normalizedText = text.trim().toUpperCase().replace(/\s+/g, ' ');
      
      console.log(`🔍 Parsing SMS: "${normalizedText}"`);

      // Check for HELP command first
      if (this.isHelpCommand(normalizedText)) {
        return {
          isValid: true,
          command: 'HELP',
          originalText: text
        };
      }

      // Extract coordinates
      const coordinates = this.extractCoordinates(normalizedText);
      
      if (!coordinates.isValid) {
        return {
          isValid: false,
          error: 'Invalid coordinates. Use: WEATHER -18.4,30.8'
        };
      }

      // Determine command type
      const command = this.extractWeatherCommand(normalizedText);
      
      if (!command.isValid) {
        return {
          isValid: false,
          error: 'Unknown command. Use: WEATHER, FORECAST, RAINHISTORY, or HELP'
        };
      }

      return {
        isValid: true,
        command: command.type,
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng
        },
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
   * Check if this is a help command
   * @param {string} text - Normalized text
   * @returns {boolean} - True if help command
   */
  isHelpCommand(text) {
    const helpPatterns = ['HELP', 'INFO', 'COMMANDS', '?'];
    return helpPatterns.some(pattern => text.includes(pattern));
  }

  /**
   * Extract coordinates from SMS text
   * @param {string} text - Normalized SMS text
   * @returns {Object} - Coordinates object
   */
  extractCoordinates(text) {
    // Look for lat,lng patterns: -18.4,30.8 or -18.4, 30.8
    const coordRegex = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;
    const match = text.match(coordRegex);

    if (!match) {
      return { isValid: false };
    }

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    // Validate coordinate ranges (Africa bounds)
    if (lat < -35 || lat > 37 || lng < -20 || lng > 55) {
      return { 
        isValid: false,
        error: 'Coordinates must be within Africa region' 
      };
    }

    // Basic sanity check
    if (isNaN(lat) || isNaN(lng)) {
      return { 
        isValid: false,
        error: 'Invalid coordinate format' 
      };
    }

    return {
      isValid: true,
      lat: lat,
      lng: lng,
      raw: match[0]
    };
  }

  /**
   * Extract weather command type
   * @param {string} text - Normalized SMS text
   * @returns {Object} - Command object
   */
  extractWeatherCommand(text) {
    const commands = [
      { pattern: /\bWEATHER\b/, type: 'WEATHER' },
      { pattern: /\bFORECAST\b/, type: 'FORECAST' },
      { pattern: /\bRAINHISTORY\b/, type: 'RAINHISTORY' },
      { pattern: /\bRAIN\s*HISTORY\b/, type: 'RAINHISTORY' },
      { pattern: /\bHISTORY\b/, type: 'RAINHISTORY' }
    ];

    for (const cmd of commands) {
      if (cmd.pattern.test(text)) {
        return {
          isValid: true,
          type: cmd.type
        };
      }
    }

    return { isValid: false };
  }

  /**
   * Validate parsed command
   * @param {Object} parsedCommand - Parsed command object
   * @returns {Object} - Validation result
   */
  validateCommand(parsedCommand) {
    if (!parsedCommand.isValid) {
      return { isValid: false, error: parsedCommand.error };
    }

    // All weather commands (except HELP) need coordinates
    if (parsedCommand.command !== 'HELP' && !parsedCommand.coordinates) {
      return { 
        isValid: false, 
        error: 'Coordinates required. Format: WEATHER -18.4,30.8' 
      };
    }

    return { isValid: true };
  }

  /**
   * Get command examples for help
   * @returns {Array} - Array of example commands
   */
  getCommandExamples() {
    return [
      'WEATHER -18.4,30.8',
      'FORECAST -18.4,30.8',
      'RAINHISTORY -18.4,30.8',
      'HELP'
    ];
  }
}

// Export singleton instance
module.exports = new WeatherParser();
