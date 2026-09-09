import React from 'react';
import { UserProfile } from '../../types';
import { TextInput, TextArea, FieldLabel } from '../ui/FormControls';

interface UserProfileSettingsProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
}

const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({ userProfile, setUserProfile }) => {
  return (
    <>
      <div className="mb-4">
        <FieldLabel>Your Name</FieldLabel>
        <TextInput
          type="text"
          placeholder="How should characters address you?"
          value={userProfile.name}
          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
        />
      </div>

      <div className="mb-2">
        <FieldLabel>About You (Bio/Preferences)</FieldLabel>
        <TextArea
          placeholder="Tell characters a bit about yourself (e.g., your hobbies, communication style)..."
          value={userProfile.bio}
          onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        This information is shared with characters to personalize conversations.
      </p>
    </>
  );
};

export default UserProfileSettings;
