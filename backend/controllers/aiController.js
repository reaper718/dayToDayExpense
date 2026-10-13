require("dotenv").config();
const {GoogleGenAI} = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINAI_API_KEY
});

const interaction = async (req,res) => {
    try {
        const {description} = req.body;

        const response = await ai.interactions.create({
            model: "gemini-3.8-flash",
            input: `
                Classify this expense description into exactly one of these categories:
                Food, Fuel, Electricity, Movie.

                Description: "${description}"

                Return only the category name.
                Do not explain your answer.
            `
        });
        console.log(response.output_text)
        res.status(200).json({
            category: response.output_text.trim()
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: error
        })
    }
}

module.exports = {
    interaction
}