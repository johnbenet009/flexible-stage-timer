import React, { useRef, useState, useCallback } from 'react';
import { X, Image, Camera, Video, RefreshCw } from 'lucide-react';

interface DisplaySettingsProps {
  onClose: () => void;
  onBackgroundChange: (type: string, source: string | null) => void;
}

export function DisplaySettings({ onClose, onBackgroundChange }: DisplaySettingsProps) {
  const [selectedOption, setSelectedOption] = useState<string>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onBackgroundChange('image', reader.result as string);
        setSelectedOption('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onBackgroundChange('video', reader.result as string);
        setSelectedOption('video');
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      onBackgroundChange('webcam', null);
      setSelectedOption('webcam');
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  }, [onBackgroundChange]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Display Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`w-full ${selectedOption === 'image' ? 'bg-purple-700' : 'bg-purple-600'} text-white px-4 py-2 rounded hover:bg-purple-500`}
          >
            <Image className="inline-block mr-2" size={18} />
            Upload Background Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <button 
            onClick={startWebcam}
            className={`w-full ${selectedOption === 'webcam' ? 'bg-blue-700' : 'bg-blue-600'} text-white px-4 py-2 rounded hover:bg-blue-500`}
          >
            <Camera className="inline-block mr-2" size={18} />
            Use Webcam
          </button>

          <button 
            onClick={() => videoInputRef.current?.click()}
            className={`w-full ${selectedOption === 'video' ? 'bg-green-700' : 'bg-green-600'} text-white px-4 py-2 rounded hover:bg-green-500`}
          >
            <Video className="inline-block mr-2" size={18} />
            Upload Video Background
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4"
            className="hidden"
            onChange={handleVideoUpload}
          />

          <button 
            onClick={() => {
              onBackgroundChange('default', null);
              setSelectedOption('default');
            }}
            className={`w-full ${selectedOption === 'default' ? 'bg-gray-700' : 'bg-gray-600'} text-white px-4 py-2 rounded hover:bg-gray-500`}
          >
            <RefreshCw className="inline-block mr-2" size={18} />
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}