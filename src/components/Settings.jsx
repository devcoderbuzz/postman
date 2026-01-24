import { useState, useRef } from 'react';
import { Moon, Sun, Upload, FolderOpen } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { ResetPasswordModal } from './ResetPasswordModal';
import { updateProfilePic, resetPassword } from '../services/apiservice';
import { useAuth } from '../contexts/AuthContext';

export function Settings({
    user,
    theme,
    setTheme,
    layout,
    setLayout,
    profilePic,
    setProfilePic,
    onLogout,
    localCollectionsPath,
    setLocalCollectionsPath
}) {
    const { updateUserData } = useAuth();
    const [tempImage, setTempImage] = useState(null);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const fileInputRef = useRef(null);

    const handleResetPassword = async (username, { currentPassword, newPassword }) => {
        try {
            if (!user?.id || !user?.token) {
                throw new Error("User session invalid. Please re-login.");
            }

            await resetPassword(
                user.id,
                user.username,
                currentPassword,
                newPassword,
                user.token
            );

            window.alert(`Password for ${user?.username} has been successfully reset!`);
        } catch (error) {
            console.error('Failed to reset password:', error);
            // Re-throw so the modal can show the error
            throw error;
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setTempImage(reader.result);
            };
        }
    };

    const handleCropComplete = async (croppedImage) => {
        console.log('handleCropComplete triggered. Image data starts with:', croppedImage?.substring(0, 50));
        try {
            console.log('Current User object in Settings:', JSON.stringify(user));
            const sizeKB = Math.round(croppedImage.length / 1024);
            console.log(`Saving image of size: ${sizeKB}KB`);

            const userIdToUpdate = user?.id || user?.userId;

            if (userIdToUpdate) {
                console.log('Final User ID being used for update:', userIdToUpdate);
                const response = await updateProfilePic(userIdToUpdate, croppedImage, user.token);

                // Update local storage too so reload keeps it
                localStorage.setItem('profilePic', croppedImage);

                // Update global context so other components see it
                updateUserData({ profileImage: croppedImage });

                setProfilePic(croppedImage);
                setTempImage(null);

                // Use the message from the server if available
                const successMsg = response?.message || `Profile picture updated successfully! (${sizeKB}KB)`;
                alert(successMsg);
            } else {
                console.error('Update failed: No user ID found in session', user);
                alert(`Warning: No user ID in session (user: ${user?.username}). Please re-login.`);
                return;
            }
        } catch (error) {
            console.error('Failed to update profile pic:', error);
            const sizeKB = Math.round(croppedImage.length / 1024);
            alert(`Error (${sizeKB}KB): ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-8 max-w-2xl mx-auto w-full overflow-y-auto no-scrollbar">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h2>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-8">
                {/* User Profile Section */}
                <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Profile</h3>
                    <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="relative group cursor-pointer"
                        >
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500 transition-all group-hover:opacity-75">
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.username?.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </button>
                        <div className="flex-1 space-y-1">
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{user?.username}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'User'}</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                            >
                                Change Profile Picture
                            </button>
                        </div>
                    </div>
                </div>


                {/* Appearance & Layout sections merged/existing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Appearance</h3>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 w-full">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'light'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'dark'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Layout</h3>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 w-full">
                            <button
                                onClick={() => setLayout('vertical')}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${layout === 'vertical'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Vertical
                            </button>
                            <button
                                onClick={() => setLayout('horizontal')}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${layout === 'horizontal'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Horizontal
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Actions Section */}
                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Account Security</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsResetPasswordOpen(true)}
                            className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center"
                        >
                            Reset Password
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex-1 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg shadow-red-600/20 active:scale-95 text-center"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                        POSTMAN STUDIO • VERSION 2.0.0
                    </p>
                </div>
            </div>

            {
                tempImage && (
                    <ImageCropper
                        image={tempImage}
                        onCropComplete={handleCropComplete}
                        onCancel={() => setTempImage(null)}
                    />
                )
            }

            <ResetPasswordModal
                isOpen={isResetPasswordOpen}
                onClose={() => setIsResetPasswordOpen(false)}
                onSave={handleResetPassword}
                username={user?.username}
            />
        </div >
    );
}
