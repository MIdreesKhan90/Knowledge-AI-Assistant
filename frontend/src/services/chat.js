
import api from "./axios";

export const askAI = async (question, conversationId) => {
    const response = await api.post("/chat/ask", {
        question,
        conversation_id: conversationId,
    });

    return response.data;
};
