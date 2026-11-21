import api from "./axios";

// Upload Document
export const uploadDocument = async (
    file,
    onProgress,
    knowledgeBaseId = null
) => {
    const formData = new FormData();
    formData.append("file", file);

    if (knowledgeBaseId !== null) {
        formData.append("knowledge_base_id", knowledgeBaseId);
    }

    const response = await api.post("/documents/upload", formData, {
        onUploadProgress: (event) => {
            if (event.total && onProgress) {
                const progress = Math.round(
                    (event.loaded * 100) / event.total
                );

                onProgress(progress);
            }
        },
    });

    return response.data;
};

// Get All Knowledge Bases
export const getKnowledgeBases = async () => {
    const response = await api.get("/knowledge-bases/");
    return response.data;
};

// Create Knowledge Base
export const createKnowledgeBase = async (data) => {
    const response = await api.post("/knowledge-bases/", data);
    return response.data;
};

// Rename Knowledge Base
export const updateKnowledgeBase = async (id, data) => {
    const response = await api.patch(`/knowledge-bases/${id}`, data);
    return response.data;
};

// Delete Knowledge Base
export const deleteKnowledgeBase = async (id) => {
    const response = await api.delete(`/knowledge-bases/${id}`);
    return response.data;
};

// Get Documents
export const getDocuments = async (knowledgeBaseId = null) => {
    const response = await api.get("/documents/", {
        params:
            knowledgeBaseId !== null
                ? { knowledge_base_id: knowledgeBaseId }
                : {},
    });

    return response.data;
};

// Assign or Unassign Document
export const assignDocumentKnowledgeBase = async (
    documentId,
    knowledgeBaseId
) => {
    const response = await api.patch(
        `/documents/${documentId}/knowledge-base`,
        {
            knowledge_base_id: knowledgeBaseId,
        }
    );

    return response.data;
};

// Process Uploaded Document
export const processDocument = async (documentId) => {
    const response = await api.post(
        `/documents/${documentId}/process`,
        {}
    );

    return response.data;
};

// Delete Document
export const deleteDocument = async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
};

// Semantic Document Search
export const searchDocuments = async (
    query,
    topK = 5,
    knowledgeBaseId = null
) => {
    const response = await api.post("/documents/search", {
        query,
        top_k: topK,
        knowledge_base_id: knowledgeBaseId,
    });

    return response.data;
};

// Download Original Document
export const downloadDocument = async (documentId) => {
    const response = await api.get(
        `/documents/${documentId}/download`,
        {
            responseType: "blob",
        }
    );

    return response;
};

// Ask AI from Documents
export const askDocuments = async (
    question,
    topK = 5,
    knowledgeBaseId = null
) => {
    const response = await api.post("/documents/ask", {
        question,
        top_k: topK,
        knowledge_base_id: knowledgeBaseId,
    });

    return response.data;
};