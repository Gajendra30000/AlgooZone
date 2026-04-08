import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DsaSheet from '../models/DsaSheet.js';
import { striverA2Z, blind75, loveBabbar450 } from '../data/sheetsData.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedSheets = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Clear existing sheets
        await DsaSheet.deleteMany({});
        console.log("Cleared existing sheets...");

        const allData = [...striverA2Z, ...blind75, ...loveBabbar450];

        await DsaSheet.insertMany(allData);
        console.log(`Seeded ${allData.length} sheet topics successfully!`);

        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding sheets:", error);
        process.exit(1);
    }
};

seedSheets();
