import api, { handleApiError } from './api';

export interface UserProfile {
    username: string;
    displayName: string;
    bio: string;
    location: string;
    avatarUrl: string;
    joinedAt: string;
    email?: string; // Only present for "me"
    fullName?: string; // Potential backend mismatch
    name?: string;     // Potential backend mismatch
    stats?: {
        projects: number;
        roomsJoined: number;
        contributions: number;
        streak: number;
    }
}

export interface ProfileUpdateDTO {
    displayName?: string;
    bio?: string;
    location?: string;
}

export interface UsernameUpdateDTO {
    username: string;
}

export interface AvatarUpdateDTO {
    avatarUrl: string;
}

export const profileService = {
    // 1.1 Public Profile
    getPublicProfile: async (username: string): Promise<UserProfile> => {
        try {
            const response = await api.get(`/api/profiles/${username}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // 1.2 Private Profile
    getMyProfile: async (): Promise<UserProfile> => {
        try {
            const response = await api.get('/api/profiles/me');
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // 1.3 Update Profile (Safe fields)
    updateProfile: async (data: ProfileUpdateDTO): Promise<void> => {
        try {
            await api.put('/api/profiles/me', data);
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // 1.4 Update Username
    updateUsername: async (data: UsernameUpdateDTO): Promise<void> => {
        try {
            await api.put('/api/profiles/me/username', data);
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // 1.5 Update Avatar
    // 1.5 Update Avatar (Auto-upload)
    updateAvatar: async (file: File): Promise<UserProfile> => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            // Explicitly attach token to ensure it's not lost during FormData handling
            const token = localStorage.getItem("access_token");
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await api.post('/api/profiles/me/avatar/upload', formData, {
                headers
            });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};
