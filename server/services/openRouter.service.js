// services/openRouter.service.js

import axios from "axios";

export const askAi = async (messages) => {
    try {

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "arcee-ai/trinity-large-preview:free",
                messages,
                reasoning: {
                    enabled: true
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data?.choices?.[0]?.message?.content || "";

    } catch (error) {
        console.error("OpenRouter Error:", error.response?.data || error.message);
        throw new Error("OpenRouter API Error");
    }
};