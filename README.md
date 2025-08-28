# 🔍 Prospeo Email Finder Tool

A full-stack web application for finding professional email addresses using the Prospeo API. This tool processes CSV files and enriches them with email data while respecting API rate limits.

## 🚀 Features

- **API Key Management**: Secure handling of Prospeo API credentials
- **CSV Processing**: Bulk email finding from CSV files with first_name, last_name, and company columns
- **Real-time Logging**: Live progress tracking with detailed status updates
- **Rate Limiting**: Built-in 1.5-second delays to respect API limits (5 calls/sec)
- **Download Results**: Automatic download of enriched CSV with email and email_status columns
- **Error Handling**: Comprehensive error management and user feedback
- **CORS Solution**: Node.js proxy server to handle cross-origin requests

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Your Prospeo API Key
1. Visit [Prospeo.io](https://prospeo.io) and create an account
2. Navigate to your API settings to get your API key
3. Copy the API key for use in the application

### 3. Run the Application
```bash
npm start
```
The server will start on `http://localhost:3000`

### 4. Using the Tool
1. **Enter API Key**: Paste your Prospeo API key in the input field
2. **Test Connection**: Click "Quick API Test" to verify your API key works
3. **Upload CSV**: Select a CSV file with columns: `first_name`, `last_name`, `company`
4. **Process Data**: Click "Process CSV" to start email finding
5. **Download Results**: The enriched CSV will automatically download when complete

## 📁 CSV Format Requirements

Your CSV file should include these columns:
- `first_name` (optional)
- `last_name` (optional)
- `company` (required)

Example CSV:
```csv
first_name,last_name,company
John,Doe,intercom.com
Jane,Smith,github.com
Mike,Johnson,stripe.com
```

## 🔧 API Rate Limiting

The tool includes automatic rate limiting:
- **Delay**: 1.5 seconds between requests
- **Reason**: Prospeo API allows 5 calls per second
- **Estimation**: Processing time is calculated and displayed

## ⚠️ Error Handling

The application handles various error scenarios:
- Invalid API keys
- Network connectivity issues
- Malformed CSV files
- API rate limit exceeded
- Missing required fields

## 🌐 Deployment

### Netlify Deployment
1. Connect your repository to Netlify
2. Set build command: `npm install && npm run build` (if needed)
3. Set publish directory: `.` (root directory)
4. Deploy!

### Environment Variables
If using environment variables for the API key:
- Set `PROSPEO_KEY` in your environment
- Modify the code to use `process.env.PROSPEO_KEY`

## 📊 Output Format

The enriched CSV will contain all original columns plus:
- `email`: Found email address (empty if not found)
- `email_status`: Status of the email search (VALID, INVALID, NO_RESULT, etc.)

## 🔐 Security Notes

- API keys are handled client-side for simplicity
- For production use, consider server-side API key storage
- The proxy server prevents CORS issues while maintaining security

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure the Node.js server is running
2. **API Key Invalid**: Verify your Prospeo API key is correct
3. **CSV Not Processing**: Check that your CSV has the required columns
4. **Slow Processing**: This is normal due to rate limiting (1.5s between requests)

### Getting Help:
- Check the real-time logs in the application
- Verify your CSV format matches requirements
- Test your API key with the "Quick API Test" feature

## 📝 License

This project is for educational and development purposes. Please ensure you comply with Prospeo's Terms of Service when using their API.

---

Made with ❤️ for efficient email finding and data enrichment.