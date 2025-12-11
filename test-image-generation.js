import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI client
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Test image generation with DALL-E 3
async function testImageGeneration() {
    try {
        console.log("Testing image generation with DALL-E 3...");
        
        const imagePrompt = `
High quality product photo.

Product details: A sleek modern smartphone with a large display.

Style:
- Clean studio lighting
- White or light neutral background
- Square format
- Sharp, realistic, professional
`;

        // Generate image using DALL-E 3 with 1024x1024 size
        const img = await client.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            size: "1024x1024",
            quality: "standard"
        });

        console.log("✅ Image generation successful!");
        console.log(`Image URL: ${img.data[0]?.url}`);
    } catch (error) {
        console.error("❌ Error in image generation:", error);
    }
}

// Run the test
testImageGeneration();