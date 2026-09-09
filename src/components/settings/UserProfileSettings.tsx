import React from 'react';
import { FaUser } from 'react-icons/fa';
import { UserProfile } from '../../types';
import { TextInput, TextArea } from '../ui/FormControls';
import { SettingsCard, SettingsRow } from './SettingsCard';

interface UserProfileSettingsProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
}

const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({ userProfile, setUserProfile }) => {
  return (
    <SettingsCard>
      <div className="p-5 flex gap-5 items-center">
        <div className="w-[72px] h-[72px] rounded-full bg-muted grid place-items-center text-muted-foreground flex-none">
          <FaUser size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] text-foreground">Your persona</div>
          <div className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
            How characters see and address you. Shared with every character to personalize the conversation.
          </div>
        </div>
      </div>

      <SettingsRow label="Your name" hint="How should characters address you?">
        <TextInput
          type="text"
          placeholder="e.g. Pixel"
          value={userProfile.name}
          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
        />
      </SettingsRow>

      <SettingsRow label="About you" hint="Hobbies, communication style, anything a character should know." align="start">
        <TextArea
          placeholder="Tell characters a bit about yourself (e.g., your hobbies, communication style)..."
          value={userProfile.bio}
          onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
        />
      </SettingsRow>
    </SettingsCard>
  );
};

export default UserProfileSettings;
