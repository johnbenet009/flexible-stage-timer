import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Image, Camera, Video, RefreshCw, ZoomIn, ZoomOut, FastForward, Rewind } from 'lucide-react';
import { DisplaySizeSettings } from '../types';

interface DisplaySettingsProps {
  onClose: () => void;
  onBackgroundChange: (type: string, source: string | null) => void;
}

const DEFAULT_SIZES: DisplaySizeSettings = {
  timer: 100,
  alert: 100,
  nextProgram: 100,
  alertSpeed: 100,
};

export function DisplaySettings({ onClose, onBackgroundChange }: DisplaySettingsProps) {
  const [selectedOption, setSelectedOption] = useState<string>('default');
  const [sizes, setSizes] = useState<DisplaySizeSettings>(() => {
    const savedSizes = localStorage.getItem('displaySizes');
    return savedSizes ? JSON.parse(savedSizes) : DEFAULT_SIZES;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('displaySizes', JSON.stringify(sizes));
    // Dispatch storage event for real-time updates
    window.dispatchEvent(new Event('storage'));
  }, [sizes]);

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

  const adjustSize = (key: keyof DisplaySizeSettings, amount: number) => {
    setSizes(prev => ({
      ...prev,
      [key]: Math.max(10, Math.min(300, prev[key] + amount)),
    }));
  };

  const resetSizes = () => {
    setSizes(DEFAULT_SIZES);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Display Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Background Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2">Background</h3>
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

          {/* Size Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2">Size Controls</h3>
            
            {/* Timer Size */}
            <div className="flex items-center justify-between bg-gray-700 p-3 rounded">
              <span className="text-white">Timer Size</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => adjustSize('timer', -10)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-white w-16 text-center">{sizes.timer}%</span>
                <button
                  onClick={() => adjustSize('timer', 10)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            {/* Alert Size */}
            <div className="flex items-center justify-between bg-gray-700 p-3 rounded">
              <span className="text-white">Alert Size</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => adjustSize('alert', -10)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-white w-16 text-center">{sizes.alert}%</span>
                <button
                  onClick={() => adjustSize('alert', 10)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            {/* Alert Speed */}
            <div className="flex items-center justify-between bg-gray-700 p-3 rounded">
              <span className="text-white">Alert Scroll Speed</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => adjustSize('alertSpeed', -10)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                >
                  <FastForward size={18} />
                </button>
                <span className="text-white w-16 text-center">{sizes.alertSpeed}%</span>
                <button
                  onClick={() => adjustSize('alertSpeed', 10)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                >
                  <Rewind size={18} />
                </button>
              </div>
            </div>

            {/* Next Program Size */}
            <div className="flex items-center justify-between bg-gray-700 p-3 rounded">
              <span className="text-white">Up Next Size</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => adjustSize('nextProgram', -10)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-white w-16 text-center">{sizes.nextProgram}%</span>
                <button
                  onClick={() => adjustSize('nextProgram', 10)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            <button
              onClick={resetSizes}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 mt-4"
            >
              <RefreshCw className="inline-block mr-2" size={18} />
              Reset All Sizes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}