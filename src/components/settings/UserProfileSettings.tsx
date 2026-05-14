import React from 'react';
import { UserProfile } from '../../types';

interface UserProfileSettingsProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
}

const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({ userProfile, setUserProfile }) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
        <input
          type="text"
          placeholder="How should characters address you?"
          value={userProfile.name}
          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
        />
      </div>
      
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About You (Bio/Preferences)</label>
        <textarea
          placeholder="Tell characters a bit about yourself (e.g., your hobbies, communication style)..."
          value={userProfile.bio}
          onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all resize-y min-h-[80px]"
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        This information is shared with characters to personalize conversations.
      </p>
    </>
  );
};

export default UserProfileSettings;
