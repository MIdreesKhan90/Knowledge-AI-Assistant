import api from "./axios";

export const createConversation = async () => {
    const response = await api.post("/chat/conversations", {});
    return response.data;
};

export const getConversations = async () => {
    const response = await api.get("/chat/conversations");
    return response.data;
};

export const getConversationMessages = async (conversationId) => {
    const response = await api.get(
        `/chat/conversations/${conversationId}/messages`
    );
    return response.data;
};

export const renameConversation = async (conversationId, title) => {
    const response = await api.patch(
        `/chat/conversations/${conversationId}`,
        { title }
    );
    return response.data;
};

export const deleteConversation = async (conversationId) => {
    const response = await api.delete(
        `/chat/conversations/${conversationId}`
    );
    return response.data;
};