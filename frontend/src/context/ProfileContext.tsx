import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, profileService } from '../services/profileService';

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    displayName: string;
    initials: string;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }
            const data = await profileService.getMyProfile();
            setProfile(data);
            setError(null);
        } catch (err: any) {
            console.error("Failed to load global profile", err);
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        // Optional: Listen for storage events if token changes in another tab
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token') fetchProfile();
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Derived logic
    let displayName = "User";
    let initials = "??";

    if (profile) {
        const vals = [
            profile.displayName,
            profile.fullName,
            profile.name,
            profile.username
        ].map(v => v?.trim());
        const [dn, fn, n, un] = vals;

        if (dn && dn.length > 0 && dn !== '?' && dn !== 'User') displayName = dn;
        else if (fn && fn.length > 0) displayName = fn;
        else if (n && n.length > 0 && n !== 'User') displayName = n;
        else if (un) displayName = un;

        const parts = displayName.trim().split(' ');
        if (parts.length >= 2) {
            initials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (displayName.length >= 2) {
            initials = displayName.substring(0, 2).toUpperCase();
        } else if (displayName.length === 1) {
            initials = displayName.toUpperCase();
        }
    }

    return (
        <ProfileContext.Provider value={{
            profile,
            loading,
            error,
            refreshProfile: fetchProfile,
            displayName,
            initials
        }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
