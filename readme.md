# ContentGen - AI Content Generator

A modern web application that uses multiple AI models to generate marketing content including titles, descriptions, hashtags, images, and videos.

## ✨ Features

- 📝 **Text Generation**: Create SEO-optimized titles, descriptions, and hashtags
- 🖼️ **Image Generation**: Generate product images with multiple AI models
- 🎬 **Video Generation**: Create promotional videos from text descriptions
- 🔄 **Multi-Model Support**: Switch between different AI providers
- ⚡ **Real-time Generation**: Get instant results with progress feedback

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- npm (Node Package Manager)
- API keys from supported services

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd ContentGen

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # If .env.example exists
# Or create .env file manually

Configuration
Create a .env file with your API keys:

env
PORT=3000
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
QUBRID_API_KEY=your_qubrid_key_here
RUNWAY_API_KEY=your_runway_key_here
Run the Application
bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
Visit http://localhost:3000 in your browser.

📋 Available Models
Text Generation
Model	Provider	Status
GPT-4.1 Mini	OpenAI	✅ Working
GPT-4o	OpenAI	✅ Working
GPT-4 Turbo	OpenAI	✅ Working
GPT-3.5 Turbo	OpenAI	✅ Working
Image Generation
Model	Provider	Status
DALL-E 3	OpenAI	✅ Working
DALL-E 2	OpenAI	✅ Working
Qubrid Tongyi-MAI	Qubrid	✅ Working
Video Generation
Model	Provider	Status	Notes
Runway Gen-2	Runway	✅ Working	Primary video option
OpenAI Sora	OpenAI	❌ Not Available	API not public
Gemini (Veo)	Google	❌ Not Available	API not public
🔧 API Endpoints
GET /api/health - Health check

GET /api/models - List all available models

POST /api/generate-all - Generate title, tags, and description

POST /api/generate-image - Generate product images

POST /api/generate-video - Generate product videos

📁 Project Structure
text
ContentGen/
├── server.js          # Main Express server
├── package.json       # Dependencies
├── .env              # Environment variables
├── public/           # Frontend static files
│   ├── index.html    # Main interface
│   ├── style.css     # Styles
│   └── script.js     # Frontend logic
└── node_modules/     # Dependencies