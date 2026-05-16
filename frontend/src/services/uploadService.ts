import api, { handleApiError } from './api';

export const uploadService = {
    /**
     * Uploads a file and returns the public URL.
     * @param file The file to upload
     * @returns Promise<string> The URL of the uploaded file
     */
    uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Assuming a standard upload endpoint. 
            // If the backend requires a specific endpoint for avatars, we might need to adjust.
            // For now, using a generic /api/uploads endpoint which is common.
            // Axios automatically sets Content-Type to multipart/form-data with correct boundary
            const response = await api.post('/api/uploads', formData);
            return response.data.url;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};
