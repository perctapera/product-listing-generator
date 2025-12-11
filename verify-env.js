import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Check if QUBRID_API_KEY is set
if (process.env.QUBRID_API_KEY) {
    console.log("✅ QUBRID_API_KEY is set in .env file");
    // Don't print the actual key for security reasons
    console.log(`   Value starts with: ${process.env.QUBRID_API_KEY.substring(0, 3)}...`);
} else {
    console.log("❌ QUBRID_API_KEY is NOT set in .env file");
}

// Check other environment variables
if (process.env.OPENAI_API_KEY) {
    console.log("✅ OPENAI_API_KEY is set in .env file");
} else {
    console.log("❌ OPENAI_API_KEY is NOT set in .env file");
}

if (process.env.PORT) {
    console.log(`✅ PORT is set to: ${process.env.PORT}`);
} else {
    console.log("❌ PORT is NOT set in .env file");
}