import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️  OPENAI_API_KEY not set in .env. The API calls will fail.");
}

// Init OpenAI client
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Available models configuration
const AVAILABLE_MODELS = {
    text: {
        "gpt-4.1-mini": {
            name: "GPT-4.1 Mini",
            temperature: 0.7
        },
        "gpt-4o": {
            name: "GPT-4o",
            temperature: 0.7
        },
        "gpt-4-turbo": {
            name: "GPT-4 Turbo",
            temperature: 0.7
        },
        "gpt-3.5-turbo": {
            name: "GPT-3.5 Turbo",
            temperature: 0.7
        }
    },
    image: {
        "gpt-image-1": {
            name: "DALL-E 3",
            size: "1024x1024",
            apiModel: "dall-e-3",
            provider: "openai"
        },
        "gpt-image-2": {
            name: "DALL-E 2",
            size: "1024x1024",
            apiModel: "dall-e-2",
            provider: "openai"
        },
        "qubrid-image-1": {
            name: "Qubrid Tongyi-MAI",
            size: "1024x1024",
            apiModel: "Tongyi-MAI/Z-Image-Turbo",
            provider: "qubrid"
        }
    },
    video: {
        "runway-gen2": {
            name: "Runway Gen-2",
            provider: "runway",
            maxDuration: "10s"
        }
    }
};

// Simple health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// Get available models
app.get("/api/models", (req, res) => {
    res.json(AVAILABLE_MODELS);
});

// Main endpoint: generate title, tags, description
app.post("/api/generate-all", async (req, res) => {
    try {
        const { description, model = "gpt-4.1-mini" } = req.body;

        if (!description || description.trim().length < 10) {
            return res.status(400).json({ error: "Provide a longer product description." });
        }

        // Validate model
        if (!AVAILABLE_MODELS.text[model]) {
            return res.status(400).json({ error: "Invalid model selected." });
        }

        const modelConfig = AVAILABLE_MODELS.text[model];
        console.log(`Using text model: ${model} (${modelConfig.name})`);

        const prompt = `
You are an expert content copywriter.

Given the following product description, generate:
1) A title (max 140 characters, readable, keyword-rich, no stuffing).
2) Exactly 13 hashtags, each under 20 characters.
3) An optimized product description.

Return the result in strict JSON with this structure:

{
  "title": "string",
  "tags": ["tag1", "tag2", ..., "tag13"],
  "description": "string"
}

Product Description:
${description}
`;

        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: "You write SEO-optimized content and always return valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: modelConfig.temperature
        });

        const raw = completion.choices[0].message.content;

        let data;
        try {
            const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
            data = JSON.parse(cleaned);
        } catch (err) {
            console.error("Failed to parse JSON from model:", err, raw);
            return res.status(500).json({ error: "Model returned invalid JSON. Check logs." });
        }

        if (!data.title || !Array.isArray(data.tags) || !data.description) {
            return res.status(500).json({ error: "Model response missing fields." });
        }

        res.json({
            title: data.title,
            tags: data.tags,
            description: data.description,
            model: model
        });
    } catch (error) {
        console.error("Error in /api/generate-all:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Image generation endpoint
app.post("/api/generate-image", async (req, res) => {
    try {
        const { description, model = "gpt-image-1" } = req.body;

        if (!description || description.trim().length < 10) {
            return res.status(400).json({ error: "Provide a longer product description." });
        }

        // Validate model
        if (!AVAILABLE_MODELS.image[model]) {
            return res.status(400).json({ error: "Invalid image model selected." });
        }

        const modelConfig = AVAILABLE_MODELS.image[model];
        console.log(`Using image model: ${model} (${modelConfig.name})`);

        const imagePrompt = `
High quality product photo.

Product details: ${description}

Style:
- Clean studio lighting
- White or light neutral background
- Square format
- Sharp, realistic, professional
`;

        let imageUrl;

        // Use the appropriate API based on the provider
        if (modelConfig.provider === "openai") {
            // OpenAI API
            const img = await client.images.generate({
                model: modelConfig.apiModel,
                prompt: imagePrompt,
                size: modelConfig.size,
                quality: "standard"
            });

            imageUrl = img.data[0]?.url;
        } else if (modelConfig.provider === "qubrid") {
            // Qubrid API
            if (!process.env.QUBRID_API_KEY) {
                console.warn("⚠️  QUBRID_API_KEY not set in .env. The API call will fail.");
                return res.status(500).json({ error: "Qubrid API key not configured." });
            }

            const url = "https://platform.qubrid.com/api/v1/qubridai/image/generation";
            const headers = {
                "Authorization": `Bearer ${process.env.QUBRID_API_KEY}`,
                "Content-Type": "application/json"
            };

            const data = {
                "model": modelConfig.apiModel,
                "positive_prompt": imagePrompt,
                "width": parseInt(modelConfig.size.split('x')[0]),
                "height": parseInt(modelConfig.size.split('x')[1]),
                "steps": 9,
                "cfg": 0,
                "seed": Math.floor(Math.random() * 1000) // Random seed
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Qubrid API error: ${response.status}`, errorText);
                return res.status(response.status).json({ 
                    error: `Qubrid API error: ${response.status}`,
                    details: errorText
                });
            }

            // Assuming the Qubrid API returns the image directly in the response
            const buffer = await response.buffer();
            
            // Convert buffer to base64 and create a data URL
            const base64Image = buffer.toString('base64');
            imageUrl = `data:image/png;base64,${base64Image}`;
        } else {
            return res.status(500).json({ error: "Unknown provider." });
        }

        if (!imageUrl) {
            return res.status(500).json({ error: "Failed to generate image URL." });
        }

        res.json({ 
            imageUrl,
            model: model
        });
    } catch (error) {
        console.error("Error in /api/generate-image:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Video generation function that handles different providers
const generateVideo = async (scriptData, description, modelConfig) => {
    // Check if the required API key is set
    const apiKeyEnvVar = getApiKeyEnvVar(modelConfig.provider);
    const apiKey = process.env[apiKeyEnvVar];
    
    if (!apiKey) {
        console.warn(`⚠️  ${apiKeyEnvVar} not set in .env. The API call will fail.`);
        throw new Error(`${modelConfig.provider} API key not configured.`);
    }
    
    // Generate video based on provider
    switch (modelConfig.provider) {
        case 'gemini':
            return await generateGeminiVideo(scriptData, description, apiKey);
        case 'sora':
            return await generateSoraVideo(scriptData, description, apiKey);
        case 'runway':
            return await generateRunwayVideo(scriptData, description, apiKey);
        default:
            throw new Error(`Unknown video provider: ${modelConfig.provider}`);
    }
};

// Helper function to get the appropriate environment variable name for API keys
const getApiKeyEnvVar = (provider) => {
    switch (provider) {
        case 'gemini':
            return 'GEMINI_API_KEY';
        case 'sora':
            return 'SORA_API_KEY';
        case 'runway':
            return 'RUNWAY_API_KEY';
        default:
            return `${provider.toUpperCase()}_API_KEY`;
    }
};

// Runway video generation
// Runway video generation
const generateRunwayVideo = async (scriptData, description, apiKey) => {
    console.log('Generating video with Runway...');

    const url = 'https://api.dev.runwayml.com/v1/video/generations';
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '1' // ✅ CORRECTED VERSION HEADER
    };

    const sceneDescriptions = scriptData.scenes
        .map(scene => `${scene.description} (${scene.duration})`)
        .join(', ');

    const data = {
        prompt: `A professional product advertisement video. Product: ${description}. Script: ${scriptData.script}. Scenes: ${sceneDescriptions}.`,
        // You might need to add other required parameters here.
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Runway API error: ${response.status}`, errorText);
            throw new Error(`Runway API error: ${response.status}`);
        }

        const result = await response.json();

        if (result.data && result.data[0] && result.data[0].videoUrl) {
            return result.data[0].videoUrl;
        } else {
            console.log('Unexpected Runway API response structure:', result);
            throw new Error('Could not find video URL in the Runway API response.');
        }
    } catch (error) {
        console.error('Error generating video with Runway:', error);
        throw error;
    }
};

// Helper function to extract the maximum duration from scenes
const extractMaxDuration = (scenes) => {
    let totalSeconds = 0;
    
    for (const scene of scenes) {
        const durationStr = scene.duration;
        const seconds = parseInt(durationStr.replace('s', ''));
        totalSeconds += seconds;
    }
    
    return totalSeconds;
};

// Video generation endpoint
app.post("/api/generate-video", async (req, res) => {
    try {
        const { description, model = "gemini" } = req.body;

        if (!description || description.trim().length < 10) {
            return res.status(400).json({ error: "Provide a longer product description." });
        }

        // Validate model
        if (!AVAILABLE_MODELS.video[model]) {
            return res.status(400).json({ error: "Invalid video model selected." });
        }

        const modelConfig = AVAILABLE_MODELS.video[model];
        console.log(`Using video model: ${model} (${modelConfig.name})`);
        
        // First, generate a script for the video using OpenAI
        const scriptPrompt = `
Create a short ${modelConfig.maxDuration} video script for a product advertisement.
The script should describe what would be shown visually and any text overlays.
Keep it concise and focused on showcasing the product's key features.

Product description: ${description}

Format your response as a JSON object with these fields:
{
  "script": "The video script text",
  "scenes": [
    {"description": "Scene 1 description", "duration": "3s"},
    {"description": "Scene 2 description", "duration": "4s"},
    ...
  ]
}
`;

        const scriptCompletion = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                { role: "system", content: "You create video scripts for product advertisements." },
                { role: "user", content: scriptPrompt }
            ],
            temperature: 0.7
        });

        const scriptRaw = scriptCompletion.choices[0].message.content;
        
        let scriptData;
        try {
            const cleaned = scriptRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
            scriptData = JSON.parse(cleaned);
        } catch (err) {
            console.error("Failed to parse JSON from model:", err, scriptRaw);
            return res.status(500).json({ error: "Model returned invalid script JSON." });
        }

        // Real video generation implementation using the selected provider
        let videoUrl;
        let error;

        try {
            videoUrl = await generateVideo(scriptData, description, modelConfig);
        } catch (err) {
            console.error(`Error generating video with ${modelConfig.name}:`, err);
            error = err.message || "Failed to generate video";
        }

        if (!videoUrl) {
            return res.status(500).json({ 
                error: error || `Failed to generate video with ${modelConfig.name}.`,
                fallback: true
            });
        }

        // Return the video URL and the script
        res.json({
            videoUrl,
            script: scriptData.script,
            scenes: scriptData.scenes,
            model: model
        });
    } catch (error) {
        console.error("Error in /api/generate-video:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Fallback: serve frontend
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log(`📝 Available text models: ${Object.keys(AVAILABLE_MODELS.text).join(", ")}`);
    console.log(`🖼️ Available image models: ${Object.keys(AVAILABLE_MODELS.image).join(", ")}`);
    console.log(`🎬 Available video models: ${Object.keys(AVAILABLE_MODELS.video).join(", ")}`);
});
