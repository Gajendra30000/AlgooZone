
import { GoogleGenerativeAI } from "@google/generative-ai";
import Student from "../models/Student.js";
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini
// Remove top-level init
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const analyzeProgress = async (req, res) => {
    try {
        console.log("Analyzing progress - Checking API Key...");
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing in environment variables");
            return res.status(500).json({ message: "Server configuration error: API Key missing" });
        }

        // Initialize Gemini inside the function
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-2.5-flash as requested
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const studentId = req.user.id;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // 1. Rate Check: Only once per 24 hours
        if (student.aiProgressAnalysis?.lastAnalyzedAt) {
            const lastAnalyzed = new Date(student.aiProgressAnalysis.lastAnalyzedAt);
            const now = new Date();
            const diffHours = (now - lastAnalyzed) / (1000 * 60 * 60);

            if (diffHours < 24) {
                return res.status(200).json({
                    message: "Analysis retrieved from cache (24h limit)",
                    data: student.aiProgressAnalysis,
                    cached: true
                });
            }
        }

        // 2. Prepare Data & Calculate Weighted Scores
        const stats = student.stats;
        const totalGlobalSolved = stats.totalSolved || 1;

        // Determine dynamic thresholds based on experience
        let volumeDivisor = 35;
        let strengthThreshold = 0.73;

        if (totalGlobalSolved > 1000) {
            volumeDivisor = 150;
            strengthThreshold = 0.91;
        } else if (totalGlobalSolved > 700) {
            volumeDivisor = 120;
            strengthThreshold = 0.86;
        } else if (totalGlobalSolved > 500) {
            volumeDivisor = 95;
            strengthThreshold = 0.81;
        } else if (totalGlobalSolved >= 300) {
            volumeDivisor = 50;
            strengthThreshold = 0.75;
        }
        const easyRatio = (stats.easySolved || 0) / totalGlobalSolved;
        const mediumRatio = (stats.mediumSolved || 0) / totalGlobalSolved;
        const hardRatio = (stats.hardSolved || 0) / totalGlobalSolved;

        // Approximate accuracy (global) since per-topic isn't available
        // Usually, acceptance rate is around 40-60%. Let's approximate based on ranking?
        // Or better, just assume a standard 50% if unknown, or calculate from total submissions if we had them.
        // We will mock a reasonable accuracy between 40% and 100% based on user tier for now, 
        // to enable the formula.
        const derivedAccuracy = Math.min(Math.max((stats.ranking < 100000 ? 70 : 50), 30), 90);

        const topicAnalysisData = (stats.topics || []).slice(0, 15).map(t => {
            const totalSolved = t.count;
            // Distribute totalSolved using global ratios (Heuristic)
            const easySolved = Math.round(totalSolved * easyRatio);
            const mediumSolved = Math.round(totalSolved * mediumRatio);
            const hardSolved = Math.round(totalSolved * hardRatio);

            // Heuristic Accuracy: Weighted by difficulty
            // Formula: min(90, ((easy * 0.6 + medium * 1.0 + hard * 1.4) / total) * 100)
            let topicAccuracy = 0;
            if (totalSolved > 0) {
                topicAccuracy = ((easySolved * 0.6) + (mediumSolved * 1.0) + (hardSolved * 1.4)) / totalSolved * 100;
                topicAccuracy = Math.min(topicAccuracy, 90);
            }

            // Normalize Metrics
            const accuracyScore = topicAccuracy / 100;
            const difficultyScore = totalSolved > 0 ? (mediumSolved + 2 * hardSolved) / totalSolved : 0;
            const volumeScore = Math.min(totalSolved / volumeDivisor, 1);

            // Topic Strength Score Formula
            // topicStrengthScore = (0.20 * accuracyScore) + (0.35 * difficultyScore) + (0.45 * volumeScore)
            let score = (0.20 * accuracyScore) + (0.35 * difficultyScore) + (0.45 * volumeScore);
            score = parseFloat(score.toFixed(2));

            let classification = "Weak Topic";
            if (score > strengthThreshold) classification = "Strong Topic";

            return {
                topicName: t.tagName,
                totalSolved,
                estimatedEasy: easySolved,
                estimatedMedium: mediumSolved,
                estimatedHard: hardSolved,
                estimatedAccuracy: topicAccuracy.toFixed(1),
                difficultyScore: difficultyScore.toFixed(2),
                volumeScore: volumeScore.toFixed(2),
                finalTopicStrengthScore: score,
                classification
            };
        });

        // Convert to JSON string for prompt
        const topicDataString = JSON.stringify(topicAnalysisData, null, 2);

        const prompt = `
        You are an expert DSA mentor and competitive programming coach.

        --------------------------------------------------
        WHERE THE DATA COMES FROM
        --------------------------------------------------

        The student's topic-wise performance is analyzed using both real and
        derived data due to LeetCode API limitations.

        1. Real Data (Directly from LeetCode):
        - Total number of problems solved per topic
          (e.g., Arrays: 50 solved, DP: 10 solved)
        - Global difficulty distribution
          (overall Easy / Medium / Hard ratio across all problems)

        2. Derived Data (Estimation Logic):
        - LeetCode does not provide difficulty breakdown per topic.
        - To estimate this, the student's GLOBAL difficulty ratio is
          proportionally applied to each topic.

        Example:
        If globally 20% of solved problems are Hard and a topic has 10 solved
        problems, then approximately 2 Hard problems are assumed for that topic.

        This estimation is used only to infer relative topic strength,
        not exact statistics.

        --------------------------------------------------
        SCORING METHODOLOGY
        --------------------------------------------------

        For each topic, the following metrics are calculated:

        1. Estimated Accuracy (capped at 90%):
        ((Easy × 0.6) + (Medium × 1.0) + (Hard × 1.4)) / Total × 100

        2. Normalized Accuracy:
        estimatedAccuracy / 100

        3. Difficulty Score:
        (Medium + 2 × Hard) / Total

        4. Volume Score:
        min(Total / ${volumeDivisor}, 1)

        5. Final Topic Strength Score:
        (0.20 × normalizedAccuracy) +
        (0.35 × difficultyScore) +
        (0.45 × volumeScore)

        Topic Classification:
        - Score > ${strengthThreshold} → Strong Topic
        - Score <= ${strengthThreshold} → Weak Topic

        --------------------------------------------------
        INPUT DATA
        --------------------------------------------------

        Below is the computed topic-wise analysis:

        ${topicDataString}

        Each topic includes:
        - topicName
        - totalSolved
        - estimatedEasy
        - estimatedMedium
        - estimatedHard
        - estimatedAccuracy
        - difficultyScore
        - volumeScore
        - finalTopicStrengthScore
        - classification

        --------------------------------------------------
        YOUR TASK
        --------------------------------------------------

        1. List STRONG topics. Format each entry as "Topic Name (Score: X.XX)".

        2. List WEAK topics. Format each entry as "Topic Name (Score: X.XX)".

        3. For each weak topic, suggest 2–3 concrete, actionable steps
           to improve (e.g., specific difficulty focus).

        4. Provide a short overall assessment (3–4 lines) describing
           the student's DSA preparedness and learning direction.

        --------------------------------------------------
        RULES
        --------------------------------------------------

        - Do NOT recalculate scores.
        - Do NOT introduce new formulas.
        - Do NOT mention AI, Gemini, or models.
        - Treat estimated values as relative indicators, not absolute truth.
        - Use clear, student-friendly language.
        - Keep feedback practical and motivating.
        - Output must be a valid JSON object with the following keys:
          weakTopics (array of strings, e.g. ["DP (Score: 0.35)"]),
          strongTopics (array of strings, e.g. ["Graphs (Score: 0.70)"]),
          improvementPlan (string, can contain newlines),
          suggestions (array of strings),
          summary (string)
        - The 'improvementPlan' should logically combine the suggestions for weak topics.
        - Do not output markdown code blocks, just raw JSON.
        `;

        // 3. Call Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        let analysisData;
        try {
            // Clean up potentially markdown-wrapped JSON
            let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            // Find first '{' and last '}' to handle potential extra text
            const firstOpen = cleanText.indexOf('{');
            const lastClose = cleanText.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                cleanText = cleanText.substring(firstOpen, lastClose + 1);
            }
            analysisData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            // Fallback if AI fails to return valid JSON
            return res.status(500).json({ message: "Failed to parse analysis results" });
        }

        // 4. Update Student Record
        const analysisResult = {
            weakTopics: analysisData.weakTopics || [],
            strongTopics: analysisData.strongTopics || [],
            improvementPlan: analysisData.improvementPlan || "",
            suggestions: analysisData.suggestions || [],
            summary: analysisData.summary || "",
            lastAnalyzedAt: new Date()
        };

        student.aiProgressAnalysis = analysisResult;
        await student.save();

        res.status(200).json({
            message: "Analysis generated successfully",
            data: analysisResult,
            cached: false
        });

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        res.status(500).json({ message: "Server error during analysis", error: error.message });
    }
};

export const reviewCode = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ error: "Code is required" });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing in environment variables");
            return res.status(500).json({ message: "Server configuration error: API Key missing" });
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: `
You are an expert code reviewer with 10+ years of development experience. Analyze the provided code and provide a comprehensive review with the following structure:

## 🔍 **Analysis Summary**
[Brief overview of what the code does and overall quality assessment]

## ❌ **Issues Found**
[List specific problems with clear explanations]

## ✅ **Corrected Code**
[Provide the improved version of the code with all fixes applied]

## 💡 **Improvements Made**
[Detailed explanation of each improvement and why it's better]

## 🚀 **Additional Recommendations**
[Suggestions for further enhancements, best practices, or modern alternatives]

## 📊 **Code Quality Score**
[Rate from 1-10 with explanation]

**Guidelines:**
- Always provide corrected code that is ready to use
- Explain WHY each change improves the code
- Include performance, security, and maintainability considerations
- Use clear, actionable language
- Be encouraging while being thorough
- Format code blocks properly with syntax highlighting
- Provide specific examples when suggesting alternatives
            `
        });

        const result = await model.generateContent(code);

        if (!result.response || !result.response.text()) {
            throw new Error('No response from AI model');
        }

        const responseText = result.response.text();
        console.log('AI Code Review Response generated successfully');

        res.json(responseText);

    } catch (error) {
        console.error('Error in reviewCode:', error);
        res.status(500).json({ error: "Failed to review code. Please try again." });
    }
};
