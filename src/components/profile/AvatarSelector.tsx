import React, { useState } from "react";
import { Avatar } from "../ui/Avatar";
import { Input } from "../ui/Input";
import { Check } from "lucide-react";

// Predefined avatar options
const AVATAR_OPTIONS = [
  { url: "/avatars/avatar1.png", alt: "Avatar 1" },
  { url: "/avatars/avatar2.png", alt: "Avatar 2" },
  { url: "/avatars/avatar3.png", alt: "Avatar 3" },
  { url: "/avatars/avatar4.png", alt: "Avatar 4" },
  { url: "/avatars/avatar5.png", alt: "Avatar 5" },
  { url: "/avatars/avatar6.png", alt: "Avatar 6" },
  { url: "/avatars/avatar7.png", alt: "Avatar 7" },
  { url: "/avatars/avatar8.png", alt: "Avatar 8" },
];

interface AvatarSelectorProps {
  value: string;
  onChange: (value: string) => void;
  userName: string;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  value,
  onChange,
  userName,
}) => {
  const [customUrl, setCustomUrl] = useState(value);
  const [showOptions, setShowOptions] = useState(false);

  // Update customUrl when value prop changes
  React.useEffect(() => {
    setCustomUrl(value);
  }, [value]);

  // Handle custom URL input change
  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setCustomUrl(newUrl);
    // Only update parent component when input loses focus or Enter is pressed
  };

  // Handle custom URL input blur (when user clicks away)
  const handleCustomUrlBlur = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
    }
  };

  // Handle Enter key press in custom URL input
  const handleCustomUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      if (customUrl.trim()) {
        onChange(customUrl.trim());
      }
    }
  };

  // Handle selecting a predefined avatar
  const handleSelectAvatar = (url: string) => {
    onChange(url);
    setCustomUrl(url);
    setShowOptions(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Avatar
          src={value}
          name={userName}
          size="xl"
          className="shadow-3d-md"
        />
        <div className="w-full">
          <div className="flex gap-2">
            <Input
              name="avatarUrl"
              value={customUrl}
              onChange={handleCustomUrlChange}
              onBlur={handleCustomUrlBlur}
              onKeyDown={handleCustomUrlKeyDown}
              placeholder="https://example.com/avatar.jpg"
              className="flex-grow"
            />
            <button
              type="button"
              className="px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm"
              onClick={() => {
                if (customUrl.trim()) {
                  onChange(customUrl.trim());
                }
              }}
            >
              Apply
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Enter a URL for your profile picture or{" "}
            <button
              type="button"
              className="text-primary-500 hover:text-primary-600 font-medium"
              onClick={() => setShowOptions(!showOptions)}
            >
              choose from gallery
            </button>
          </p>
        </div>
      </div>

      {showOptions && (
        <div className="bg-white p-4 rounded-lg border border-secondary-100 shadow-3d-sm animate-fade-in">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">
            Select an avatar
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_OPTIONS.map((avatar, index) => (
              <button
                key={index}
                type="button"
                className={`relative rounded-lg p-1 hover:bg-primary-50 transition-colors ${
                  value === avatar.url
                    ? "bg-primary-50 ring-2 ring-primary-500 ring-offset-2"
                    : "border border-secondary-100"
                }`}
                onClick={() => handleSelectAvatar(avatar.url)}
              >
                <Avatar
                  src={avatar.url}
                  name={userName}
                  size="md"
                  className="shadow-3d-sm"
                />
                {value === avatar.url && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
