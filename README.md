# Yieldera SMS MicroCover Module

Agricultural insurance SMS service powered by climate intelligence. Provides instant weather data, planting recommendations, and parametric insurance quotes via SMS using Africa's Talking.

## 🌾 Features

- **Weather Intelligence**: Real-time weather conditions and forecasts
- **Planting Windows**: Optimal planting timing based on climate data
- **Insurance Quotes**: Instant parametric insurance pricing for crops
- **SMS Interface**: Simple command-based interaction via SMS
- **Multi-Crop Support**: MAIZE, TOBACCO, SOYA, COTTON coverage
- **Multi-Country**: Zimbabwe, Botswana, Zambia, Tanzania, Malawi

## 📱 SMS Commands

Send SMS to your Africa's Talking number:

```
WEATHER -18.4,30.8
QUOTE MAIZE -18.4,30.8  
PLANTING -18.4,30.8
```

Replace `-18.4,30.8` with your actual GPS coordinates.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Africa's Talking account with SMS credits
- Yieldera Flask backend running
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd yieldera-sms-microcover
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
AT_USERNAME=your_at_username
AT_API_KEY=your_at_api_key
FLASK_BASE_URL=https://your-flask-backend.com/api
PORT=3000
```

4. **Start the server**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AT_USERNAME` | Africa's Talking username | `sandbox` or your username |
| `AT_API_KEY` | Africa's Talking API key | Your API key from dashboard |
| `FLASK_BASE_URL` | Yieldera Flask backend URL | `https://api.yieldera.com` |
| `PORT` | Server port | `3000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEFAULT_SENDER_ID` | SMS sender ID | `YIELDERA` |
| `SMS_TIMEOUT` | API timeout (ms) | `30000` |
| `NODE_ENV` | Environment | `development` |

## 🧪 Local Development & Testing

### Using ngrok for Webhooks

1. **Install ngrok**
```bash
# Download from https://ngrok.com/download
# Or using npm:
npm install -g ngrok
```

2. **Start your local server**
```bash
npm start
```

3. **Expose via ngrok**
```bash
ngrok http 3000
```

4. **Configure Africa's Talking webhooks** (see setup section below)

### Testing Endpoints

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Simulate SMS (for testing):**
```bash
curl -X POST http://localhost:3000/at/sms \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+263123456789",
    "to": "12345", 
    "text": "WEATHER -18.4,30.8",
    "date": "2025-01-01 12:00:00"
  }'
```

## 📡 Africa's Talking Setup

### 1. Create Account
- Sign up at [Africa's Talking](https://africastalking.com)
- Get free SMS credits for testing
- Note your username and API key

### 2. Configure SMS Callbacks

In your Africa's Talking dashboard:

**Incoming SMS URL:**
```
https://your-domain.com/at/sms
```

**Delivery Reports URL:**
```
https://your-domain.com/at/dlr
```

### 3. Sandbox Testing

For testing, use Africa's Talking Sandbox:
- Username: `sandbox`
- Phone numbers: Use test numbers like `+254711000000`
- SMS credits: Free for testing

## 🌐 Render Deployment

### 1. Connect GitHub Repository

1. Push code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to [Render Dashboard](https://render.com)
3. Click "New +" → "Web Service" 
4. Connect your GitHub repository

### 2. Configure Render Service

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node index.js
```

**Environment Variables** (add in Render dashboard):
```env
AT_USERNAME=your_at_username
AT_API_KEY=your_at_api_key  
FLASK_BASE_URL=https://your-flask-backend.com/api
NODE_ENV=production
```

### 3. Update Africa's Talking URLs

After deployment, update your Africa's Talking webhooks:

**Incoming SMS URL:**
```
https://your-render-app.onrender.com/at/sms
```

**Delivery Reports URL:**
```
https://your-render-app.onrender.com/at/dlr
```

## 📊 Project Structure

```
yieldera-sms-microcover/
├── package.json              # Dependencies and scripts
├── index.js                  # Main server file
├── .env.example             # Environment template
├── README.md                # This file
└── src/
    ├── routes/
    │   ├── sms.js           # SMS webhook handler
    │   └── dlr.js           # Delivery report handler
    ├── services/
    │   ├── smsService.js    # Africa's Talking SMS service
    │   └── flaskService.js  # Backend API client
    └── utils/
        ├── parser.js        # SMS command parser
        └── formatter.js     # SMS response formatter
```

## 🔌 API Integration

### Flask Backend Endpoints

The service expects these endpoints from your Flask backend:

```javascript
// Weather data
GET /weather?lat={lat}&lng={lng}

// Planting windows  
GET /planting?lat={lat}&lng={lng}

// Insurance quotes
POST /insurance/quote
{
  "latitude": -18.4,
  "longitude": 30.8,
  "crop_type": "MAIZE",
  "location_type": "coordinates"
}
```

### Response Formats

**Weather Response:**
```json
{
  "temperature": 25,
  "humidity": 65,
  "rainfall": 0,
  "conditions": "Clear",
  "forecast": {
    "summary": "Sunny with light winds"
  }
}
```

**Quote Response:**
```json
{
  "premium": 15,
  "coverage": 500,
  "risk_level": "medium",
  "valid_until": "2025-12-31",
  "currency": "USD"
}
```

**Planting Response:**
```json
{
  "optimal_start": "2025-11-15",
  "optimal_end": "2025-12-15", 
  "risk_level": "optimal",
  "recommendation": "Plant early season varieties"
}
```

## 🛡️ Security

- All API keys use environment variables
- Request validation and sanitization
- Rate limiting (can be implemented)
- HTTPS required in production
- Helmet.js security headers

## 📈 Monitoring

### Logs

The service logs all key events:
- Incoming SMS messages
- API calls to Flask backend
- SMS sending results
- Errors and exceptions

### Health Checks

**Health endpoint:** `GET /health`
```json
{
  "status": "healthy",
  "service": "Yieldera SMS MicroCover",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Delivery Reports

SMS delivery status tracked via `/at/dlr` endpoint for analytics.

## 🔧 Troubleshooting

### Common Issues

**1. SMS not received:**
- Check Africa's Talking webhook URLs
- Verify SMS credits available
- Check server logs for errors

**2. Weather data not loading:**
- Verify `FLASK_BASE_URL` is correct
- Check Flask backend health
- Test coordinates are valid

**3. Invalid coordinates:**
- Coordinates must be in decimal format: `-18.4,30.8`
- Valid range for Africa: lat -35 to 37, lng -20 to 55

**4. Deployment issues:**
- Check all environment variables set in Render
- Verify build and start commands
- Check Render deployment logs

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📞 Support Commands

Add these to easily extend the SMS service:

```javascript
// In parser.js, add new command patterns:
{ pattern: /\bHELP\b/, type: 'HELP' }
{ pattern: /\bSTATUS\b/, type: 'STATUS' }
{ pattern: /\bNDVI\b/, type: 'NDVI' }
```

## 🚦 Performance

- SMS responses < 150 characters
- API timeout: 30 seconds
- Concurrent request handling
- Lightweight JSON responses
- Efficient coordinate parsing

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-command`
3. Commit changes: `git commit -am 'Add new SMS command'`
4. Push branch: `git push origin feature/new-command`
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🌍 About Yieldera

Yieldera transforms satellite imagery and weather data into instant, automated agricultural insurance payouts across Africa. No loss adjusters, no delays - just farmers getting paid when triggers hit.

**Coverage Countries:** Zimbabwe, Botswana, Zambia, Tanzania, Malawi

**Supported Crops:** Maize, Tobacco, Soya, Cotton, Wheat, Barley

---

Built with 🌾 by the Yieldera team for African farmers.
