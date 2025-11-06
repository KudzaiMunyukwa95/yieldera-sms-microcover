const axios = require('axios');

class FlaskService {
  constructor() {
    this.baseURL = process.env.FLASK_BASE_URL;
    this.timeout = parseInt(process.env.SMS_TIMEOUT) || 30000;
    
    // Create axios instance with default configuration
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Yieldera-SMS-MicroCover/1.0'
      }
    });

    // Add request/response interceptors for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🌐 Flask API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Flask API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ Flask API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ Flask API Error: ${error.response?.status} ${error.config?.url}`);
        console.error('Error details:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get weather data for coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Weather data
   */
  async getWeather(lat, lng) {
    try {
      const response = await this.api.get('/weather', {
        params: { lat, lng }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Weather API error:', error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Get planting window recommendations
   * @param {number} lat - Latitude  
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Planting window data
   */
  async getPlantingWindow(lat, lng) {
    try {
      const response = await this.api.get('/planting', {
        params: { lat, lng }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Planting window API error:', error.message);
      throw new Error('Failed to fetch planting window data');
    }
  }

  /**
   * Get insurance quote for crop and location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude  
   * @param {string} crop - Crop type (e.g., 'MAIZE', 'TOBACCO', 'SOYA')
   * @param {number} coverage - Coverage amount (optional, default from API)
   * @returns {Promise<Object>} - Insurance quote data
   */
  async getInsuranceQuote(lat, lng, crop, coverage = null) {
    try {
      const payload = {
        latitude: lat,
        longitude: lng,
        crop_type: crop.toUpperCase(),
        location_type: 'coordinates'
      };

      if (coverage) {
        payload.coverage_amount = coverage;
      }

      const response = await this.api.post('/insurance/quote', payload);

      return response.data;
    } catch (error) {
      console.error('❌ Insurance quote API error:', error.message);
      throw new Error('Failed to fetch insurance quote');
    }
  }

  /**
   * Get NDVI/vegetation health data
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude  
   * @param {string} period - Time period ('current', '7days', '30days')
   * @returns {Promise<Object>} - NDVI data
   */
  async getNDVIData(lat, lng, period = 'current') {
    try {
      const response = await this.api.get('/ndvi', {
        params: { lat, lng, period }
      });

      return response.data;
    } catch (error) {
      console.error('❌ NDVI API error:', error.message);
      throw new Error('Failed to fetch vegetation data');
    }
  }

  /**
   * Get drought risk assessment
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Drought risk data
   */
  async getDroughtRisk(lat, lng) {
    try {
      const response = await this.api.get('/risk/drought', {
        params: { lat, lng }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Drought risk API error:', error.message);
      throw new Error('Failed to fetch drought risk data');
    }
  }

  /**
   * Health check for Flask backend
   * @returns {Promise<boolean>} - True if backend is healthy
   */
  async healthCheck() {
    try {
      const response = await this.api.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('❌ Flask backend health check failed:', error.message);
      return false;
    }
  }

  /**
   * Validate configuration
   * @returns {boolean} - True if properly configured
   */
  isConfigured() {
    return !!this.baseURL;
  }
}

// Export singleton instance
module.exports = new FlaskService();
