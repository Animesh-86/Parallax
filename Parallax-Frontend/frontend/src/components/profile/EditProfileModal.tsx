import { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, CheckCircle2, User, MapPin, FileText, AtSign, Upload, Camera } from 'lucide-react';
import { UserProfile, profileService } from '../../services/profileService';
import { uploadService } from '../../services/uploadService';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserProfile;
    onProfileUpdate: () => void;
}

export default function EditProfileModal({ isOpen, onClose, currentUser, onProfileUpdate }: EditProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'public' | 'account'>('public');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        avatarUrl: ''
    });

    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        if (currentUser) {
            setFormData({
                displayName: currentUser.displayName || '',
                bio: currentUser.bio || '',
                location: currentUser.location || '',
                avatarUrl: currentUser.avatarUrl || ''
            });
            setUsername(currentUser.username || '');
        }
    }, [currentUser, isOpen]);

    // Check if form is dirty
    const isDirty =
        formData.displayName !== (currentUser.displayName || '') ||
        formData.bio !== (currentUser.bio || '') ||
        formData.location !== (currentUser.location || '') ||
        formData.avatarUrl !== (currentUser.avatarUrl || '');

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview immediately
        const objectUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, avatarUrl: objectUrl }));

        // Upload
        const toastId = toast.loading("Uploading avatar...");
        try {
            const url = await uploadService.uploadFile(file);
            setFormData(prev => ({ ...prev, avatarUrl: url }));
            toast.success("Avatar uploaded", { id: toastId });
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload avatar", { id: toastId });
            // Revert
            setFormData(prev => ({ ...prev, avatarUrl: currentUser.avatarUrl }));
        }
    };

    const handleSavePublic = async () => {
        if (!isDirty) return;

        setIsLoading(true);
        let success = false;

        try {
            // 1. Update Basic Info
            if (
                formData.displayName !== currentUser.displayName ||
                formData.bio !== currentUser.bio ||
                formData.location !== currentUser.location
            ) {
                await profileService.updateProfile({
                    displayName: formData.displayName,
                    bio: formData.bio,
                    location: formData.location
                });
                success = true; // Mark as at least partially successful
            }

            // 2. Update Avatar (if changed)
            if (formData.avatarUrl !== currentUser.avatarUrl) {
                try {
                    await profileService.updateAvatar({ avatarUrl: formData.avatarUrl });
                    success = true;
                } catch (avatarErr: any) {
                    console.error("Avatar update failed", avatarErr);
                    toast.error("Profile info saved, but failed to update avatar.");
                }
            }

            if (success || (!isDirty && success === false)) { // If nothing actually changed or success
                toast.success('Profile updated successfully');
                await onProfileUpdate();
                onClose();
            }

        } catch (error: any) {
            console.error(error);
            if (error.status === 401) {
                toast.error("Session expired. Please sign in again.");
            } else {
                toast.error(error.message || 'Failed to update profile');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveUsername = async () => {
        // Basic Client Validation
        if (username.length < 3 || username.length > 30) {
            setUsernameError('Username must be between 3 and 30 characters');
            return;
        }
        if (!/^[a-z0-9_]+$/.test(username)) {
            setUsernameError('Only lowercase letters, numbers, and underscores allowed');
            return;
        }

        setIsLoading(true);
        setUsernameError('');

        try {
            await profileService.updateUsername({ username });
            toast.success('Username updated successfully');
            onProfileUpdate();
            onClose();
        } catch (error: any) {
            if (error.status === 409) {
                setUsernameError('Username is already taken');
            } else {
                toast.error(error.message || 'Failed to update username');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0C1220] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0C1220]">
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center px-6 border-b border-white/5 bg-[#0C1220]">
                    <button
                        onClick={() => setActiveTab('public')}
                        className={cn(
                            "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'public'
                                ? "border-[#38BDF8] text-white"
                                : "border-transparent text-white/50 hover:text-white/80"
                        )}
                    >
                        Public Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('account')}
                        className={cn(
                            "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'account'
                                ? "border-[#38BDF8] text-white"
                                : "border-transparent text-white/50 hover:text-white/80"
                        )}
                    >
                        Account Identity
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'public' ? (
                        <div className="space-y-6">

                            {/* Avatar Section */}
                            <div className="flex items-center gap-6">
                                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                    <div className="w-20 h-20 rounded-2xl bg-[#38BDF8]/20 border border-[#38BDF8]/50 flex items-center justify-center text-2xl font-bold text-[#38BDF8] overflow-hidden">
                                        {formData.avatarUrl ? (
                                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <span>{formData.displayName?.slice(0, 2).toUpperCase() || "ME"}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        hidden
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={handleAvatarClick}
                                        className="text-sm font-medium text-[#38BDF8] hover:text-[#7DD3FC] transition-colors"
                                    >
                                        Change Avatar
                                    </button>
                                    <p className="text-xs text-white/40">
                                        Click to upload a new avatar.<br />
                                        Recommended: Square, JPG/PNG.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Display Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                        <User className="w-4 h-4 text-[#94A3B8]" />
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                        maxLength={100}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
                                        placeholder="E.g. Alex Chen"
                                    />
                                </div>

                                {/* Bio */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[#94A3B8]" />
                                        Bio
                                    </label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        maxLength={160}
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#38BDF8]/50 transition-colors resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                    <div className="text-right text-xs text-white/40">
                                        {formData.bio.length}/160
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#94A3B8]" />
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        maxLength={100}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
                                        placeholder="E.g. San Francisco, CA"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 bg-[#FBBF24]/10 border border-[#FBBF24]/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" />
                                <div className="text-sm text-[#FBBF24]/90">
                                    <p className="font-medium mb-1">Changing your username?</p>
                                    <p className="opacity-80">This will change your public profile URL. Previous links to your profile may break.</p>
                                </div>
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <AtSign className="w-4 h-4 text-[#38BDF8]" />
                                    Username
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className={cn(
                                            "w-full bg-black/40 border rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none transition-colors",
                                            usernameError ? "border-[#EF6461] focus:border-[#EF6461]" : "border-white/10 focus:border-[#38BDF8]/50"
                                        )}
                                        placeholder="new_username"
                                    />
                                </div>
                                {usernameError && (
                                    <p className="text-xs text-[#EF6461] flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {usernameError}
                                    </p>
                                )}
                                <ul className="text-xs text-white/40 space-y-1 pl-1">
                                    <li className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-white/40" />
                                        3-30 characters
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-white/40" />
                                        a-z, 0-9, and underscore only
                                    </li>
                                </ul>
                            </div>

                            {/* Email (Read Only) */}
                            <div className="space-y-2 opacity-60">
                                <label className="text-sm font-medium text-white/80 block">Email Address</label>
                                <input
                                    type="text"
                                    value={currentUser.email || ''}
                                    disabled
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white/60 cursor-not-allowed"
                                />
                                <p className="text-xs text-white/30">Email cannot be changed at this time.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#0C1220] flex justify-end gap-3 transition-all">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={activeTab === 'public' ? handleSavePublic : handleSaveUsername}
                        disabled={isLoading || (activeTab === 'public' && !isDirty)}
                        className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] hover:shadow-lg hover:shadow-[#38BDF8]/25 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
