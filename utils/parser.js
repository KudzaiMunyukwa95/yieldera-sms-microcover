/**
 * SMS Command Parser
 * Parses incoming SMS commands and extracts coordinates, crop types, etc.
 */

class SMSParser {
  /**
   * Parse SMS command text
   * @param {string} text - Raw SMS text
   * @returns {Object} - Parsed command object
   */
  parseSMSCommand(text) {
    try {
      // Normalize text (trim, uppercase, remove extra spaces)
      const normalizedText = text.trim().toUpperCase().replace(/\s+/g, ' ');
      
      console.log(`🔍 Parsing SMS: "${normalizedText}"`);

      // Extract coordinates from text (lat,lng format)
      const coordinates = this.extractCoordinates(normalizedText);
      
      if (!coordinates.isValid) {
        return {
          isValid: false,
          error: 'Invalid or missing coordinates. Format: COMMAND lat,lng (e.g., WEATHER -18.4,30.8)'
        };
      }

      // Determine command type
      const command = this.extractCommand(normalizedText);
      
      if (!command.isValid) {
        return {
          isValid: false,
          error: 'Unknown command. Use: WEATHER, QUOTE MAIZE, or PLANTING'
        };
      }

      // Extract additional parameters based on command
      const additionalParams = this.extractAdditionalParams(normalizedText, command.type);

      return {
        isValid: true,
        command: command.type,
        coordinates: coordinates,
        ...additionalParams,
        originalText: text,
        normalizedText: normalizedText
      };

    } catch (error) {
      console.error('❌ SMS parsing error:', error.message);
      return {
        isValid: false,
        error: 'Unable to parse SMS command'
      };
    }
  }

  /**
   * Extract coordinates from SMS text
   * @param {string} text - Normalized SMS text
   * @returns {Object} - Coordinates object
   */
  extractCoordinates(text) {
    // Look for patterns like: -18.4,30.8 or -18.4, 30.8 or (-18.4,30.8)
    const coordRegex = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;
    const match = text.match(coordRegex);

    if (!match) {
      return { isValid: false };
    }

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    // Validate coordinate ranges (rough bounds for Africa)
    if (lat < -35 || lat > 37 || lng < -20 || lng > 55) {
      return { 
        isValid: false,
        error: 'Coordinates outside valid range for Africa' 
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
   * Extract command type from SMS text
   * @param {string} text - Normalized SMS text
   * @returns {Object} - Command object
   */
  extractCommand(text) {
    const commands = [
      { pattern: /\bWEATHER\b/, type: 'WEATHER' },
      { pattern: /\bQUOTE\b.*\bMAIZE\b/, type: 'QUOTE' },
      { pattern: /\bQUOTE\b.*\bTOBACCO\b/, type: 'QUOTE' },
      { pattern: /\bQUOTE\b.*\bSOYA\b/, type: 'QUOTE' },
      { pattern: /\bQUOTE\b.*\bCOTTON\b/, type: 'QUOTE' },
      { pattern: /\bPLANTING\b/, type: 'PLANTING' },
      { pattern: /\bPLANT\b/, type: 'PLANTING' }, // Alias
      { pattern: /\bHELP\b/, type: 'HELP' }
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
   * Extract additional parameters based on command type
   * @param {string} text - Normalized SMS text
   * @param {string} commandType - Command type
   * @returns {Object} - Additional parameters
   */
  extractAdditionalParams(text, commandType) {
    const params = {};

    switch (commandType) {
      case 'QUOTE':
        // Extract crop type
        params.crop = this.extractCropType(text);
        
        // Extract coverage amount if specified (e.g., $500, USD500, 500USD)
        const coverage = this.extractCoverageAmount(text);
        if (coverage) {
          params.coverage = coverage;
        }
        break;

      case 'WEATHER':
        // Extract time period if specified (e.g., 7DAYS, WEEKLY, FORECAST)
        const period = this.extractTimePeriod(text);
        if (period) {
          params.period = period;
        }
        break;

      case 'PLANTING':
        // Extract crop type if specified
        const plantingCrop = this.extractCropType(text);
        if (plantingCrop) {
          params.crop = plantingCrop;
        }
        break;
    }

    return params;
  }

  /**
   * Extract crop type from text
   * @param {string} text - SMS text
   * @returns {string|null} - Crop type or null
   */
  extractCropType(text) {
    const crops = ['MAIZE', 'TOBACCO', 'SOYA', 'COTTON', 'WHEAT', 'BARLEY'];
    
    for (const crop of crops) {
      if (text.includes(crop)) {
        return crop;
      }
    }
    
    return 'MAIZE'; // Default crop
  }

  /**
   * Extract coverage amount from text
   * @param {string} text - SMS text
   * @returns {number|null} - Coverage amount or null
   */
  extractCoverageAmount(text) {
    // Look for patterns like: $500, USD500, 500USD, 500
    const amountRegex = /(?:\$|USD)?(\d+)(?:USD)?/i;
    const match = text.match(amountRegex);

    if (match) {
      return parseInt(match[1]);
    }

    return null;
  }

  /**
   * Extract time period from text
   * @param {string} text - SMS text  
   * @returns {string|null} - Time period or null
   */
  extractTimePeriod(text) {
    if (text.includes('7DAYS') || text.includes('WEEKLY') || text.includes('WEEK')) {
      return '7days';
    }
    if (text.includes('FORECAST') || text.includes('FUTURE')) {
      return 'forecast';
    }
    if (text.includes('TODAY') || text.includes('NOW')) {
      return 'current';
    }
    
    return null;
  }

  /**
   * Validate parsed command completeness
   * @param {Object} parsedCommand - Parsed command object
   * @returns {Object} - Validation result
   */
  validateCommand(parsedCommand) {
    if (!parsedCommand.isValid) {
      return { isValid: false, error: parsedCommand.error };
    }

    // Check required fields based on command type
    switch (parsedCommand.command) {
      case 'QUOTE':
        if (!parsedCommand.crop) {
          return { 
            isValid: false, 
            error: 'Crop type required for quote. Use: QUOTE MAIZE -18.4,30.8' 
          };
        }
        break;
    }

    return { isValid: true };
  }
}

// Export singleton instance
module.exports = new SMSParser();
