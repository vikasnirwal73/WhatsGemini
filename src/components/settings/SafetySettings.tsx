import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import { AISafetySettings } from '../../types';
import { harmThresholds } from '../../utils/constants';
import { SettingsCard, SettingsRow } from './SettingsCard';
import { SegmentedControl } from './SegmentedControl';

interface SafetySettingsProps {
  chatProvider: string;
  safetySettings: AISafetySettings;
  safetyCategories: (keyof AISafetySettings)[];
  onSafetyChange: (category: keyof AISafetySettings, value: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  harassment: "Harassment",
  hate_speech: "Hate speech",
  sexual: "Sexually explicit",
  dangerous: "Dangerous content",
};

const SafetySettings: React.FC<SafetySettingsProps> = ({
  chatProvider, safetySettings, safetyCategories, onSafetyChange,
}) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border/50 text-[13px] text-muted-foreground">
        <FaShieldAlt className="text-primary flex-none" size={15} />
        <span>
          Applies to <span className="text-foreground font-medium">Google Gemini</span> only. Other providers don't
          expose an equivalent control.
        </span>
      </div>

      <SettingsCard>
        {safetyCategories.map((category) => (
          <SettingsRow key={category} label={CATEGORY_LABELS[category] || category}>
            <SegmentedControl
              value={safetySettings[category]}
              onChange={(val) => onSafetyChange(category, val)}
              options={harmThresholds}
              disabled={chatProvider !== "gemini"}
            />
          </SettingsRow>
        ))}
      </SettingsCard>
    </div>
  );
};

export default SafetySettings;
