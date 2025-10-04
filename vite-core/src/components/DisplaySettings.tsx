import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Image, Camera, Video, RefreshCw, ZoomIn, ZoomOut, FastForward, Rewind, ChevronDown } from 'lucide-react';
import { DisplaySizeSettings } from '../types';

interface DisplaySettingsProps {
  onClose: () => void;
  onBackgroundChange: (type: string, source: string | null) => void;
  onClearCache?: () => void;
}

const DEFAULT_SIZES: DisplaySizeSettings = {
  timer: 100,
  alert: 100,
  nextProgram: 100,
  alertSpeed: 100,
  clock: 100,
};

const DEFAULT_OPACITY = 80;

export function DisplaySettings({ onClose, onBackgroundChange, onClearCache }: DisplaySettingsProps) {
  const [selectedOption, setSelectedOption] = useState<string>('default');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [sizes, setSizes] = useState<DisplaySizeSettings>(() => {
    const savedSizes = localStorage.getItem('displaySizes');
    const parsedSizes = savedSizes ? JSON.parse(savedSizes) : {};
    return {
      timer: parsedSizes.timer || DEFAULT_SIZES.timer,
      alert: parsedSizes.alert || DEFAULT_SIZES.alert,
      nextProgram: parsedSizes.nextProgram || DEFAULT_SIZES.nextProgram,
      alertSpeed: parsedSizes.alertSpeed || DEFAULT_SIZES.alertSpeed,
      clock: parsedSizes.clock || DEFAULT_SIZES.clock,
    };
  });
  
  const [backgroundOpacity, setBackgroundOpacity] = useState(() => {
    const savedOpacity = localStorage.getItem('backgroundOpacity');
    return savedOpacity ? parseInt(savedOpacity) : DEFAULT_OPACITY;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('displaySizes', JSON.stringify(sizes));
    // Dispatch storage event for real-time updates
    window.dispatchEvent(new Event('storage'));
  }, [sizes]);

  useEffect(() => {
    localStorage.setItem('backgroundOpacity', backgroundOpacity.toString());
    // Dispatch storage event for real-time updates
    window.dispatchEvent(new Event('storage'));
  }, [backgroundOpacity]);

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

  const handleSplashUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('splashImage', reader.result as string);
        alert('Custom splash screen image saved! Restart the app to see changes.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('churchLogo', reader.result as string);
        window.dispatchEvent(new Event('storage'));
        alert('Church logo uploaded successfully!');
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

  const loadAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      if (cameras.length > 0 && !selectedCameraId) {
        setSelectedCameraId(cameras[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err);
    }
  }, [selectedCameraId]);

  const startWebcam = useCallback(async () => {
    try {
      const constraints = {
        video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      onBackgroundChange('webcam', selectedCameraId);
      setSelectedOption('webcam');
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  }, [onBackgroundChange, selectedCameraId]);

  useEffect(() => {
    loadAvailableCameras();
  }, [loadAvailableCameras]);

  const adjustSize = (key: keyof DisplaySizeSettings, amount: number) => {
    setSizes(prev => ({
      ...prev,
      [key]: Math.max(10, Math.min(300, prev[key] + amount)),
    }));
  };

  const resetSizes = () => {
    setSizes(DEFAULT_SIZES);
    setBackgroundOpacity(DEFAULT_OPACITY);
  };

  const adjustOpacity = (amount: number) => {
    setBackgroundOpacity(Math.max(10, Math.min(100, backgroundOpacity + amount)));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-800 p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
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
            
            {/* First Row - Image and Video */}
            <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
                className={`${selectedOption === 'image' ? 'bg-purple-700' : 'bg-purple-600'} text-white px-4 py-2 rounded hover:bg-purple-500 flex items-center justify-center`}
              >
                <Image className="mr-2" size={18} />
                Upload Image
              </button>
              <button 
                onClick={() => videoInputRef.current?.click()}
                className={`${selectedOption === 'video' ? 'bg-green-700' : 'bg-green-600'} text-white px-4 py-2 rounded hover:bg-green-500 flex items-center justify-center`}
              >
                <Video className="mr-2" size={18} />
                Upload Video
            </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4"
              className="hidden"
              onChange={handleVideoUpload}
            />

            {/* Camera Selection Row */}
            {availableCameras.length > 0 && (
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="col-span-1">
                  <label className="text-sm text-gray-300 mb-1 block">Select Camera:</label>
                <div className="relative">
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none appearance-none pr-8 text-sm"
                  >
                    {availableCameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            <button 
              onClick={startWebcam}
                  className={`${selectedOption === 'webcam' ? 'bg-blue-700' : 'bg-blue-600'} text-white px-3 py-2 rounded hover:bg-blue-500 flex items-center justify-center text-sm`}
                >
                  <Camera className="mr-2" size={16} />
                  Use Camera
            </button>
            <button 
              onClick={() => {
                onBackgroundChange('default', null);
                setSelectedOption('default');
              }}
                  className={`${selectedOption === 'default' ? 'bg-gray-700' : 'bg-gray-600'} text-white px-3 py-2 rounded hover:bg-gray-500 flex items-center justify-center text-sm`}
                >
                  <RefreshCw className="mr-2" size={16} />
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Background Opacity Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2">Background Opacity</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-white text-sm mb-3 font-medium">Dark Overlay Opacity</div>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => adjustOpacity(-10)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                  title="Decrease opacity"
                >
                  <ZoomOut size={18} />
                </button>
                <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-600 min-w-[60px] text-center">
                  <span className="text-white text-lg font-bold">{backgroundOpacity}%</span>
                </div>
                <button
                  onClick={() => adjustOpacity(10)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                  title="Increase opacity"
                >
                  <ZoomIn size={18} />
            </button>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Controls the darkness of the overlay on image/video/webcam backgrounds
              </p>
            </div>
          </div>

          {/* Splash Screen Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2">Startup Splash Screen</h3>
            
            <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => splashInputRef.current?.click()}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500 flex items-center justify-center text-sm"
              >
                <Image className="mr-2" size={16} />
                Upload Splash
              </button>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('splashImage');
                  alert('Splash screen reset to default gradient background');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 flex items-center justify-center text-sm"
              >
                <RefreshCw className="mr-2" size={16} />
                Reset Default
            </button>
            </div>
            <input
              ref={splashInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSplashUpload}
            />
            
            <p className="text-xs text-gray-400 text-center">
              Custom splash images will override the default gradient background. 
              The gradient provides a modern, professional look.
            </p>
          </div>

          {/* Church Logo Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2">Church Logo</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => logoInputRef.current?.click()}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 flex items-center justify-center text-sm"
              >
                <Image className="mr-2" size={16} />
                Upload Logo
              </button>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('churchLogo');
                  // Force storage event to update all components
                  window.dispatchEvent(new StorageEvent('storage', {
                    key: 'churchLogo',
                    newValue: null,
                    oldValue: localStorage.getItem('churchLogo')
                  }));
                  alert('Church logo removed successfully!');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 flex items-center justify-center text-sm"
              >
                <RefreshCw className="mr-2" size={16} />
                Remove Logo
              </button>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            <p className="text-xs text-gray-400 text-center">
              Upload your church logo to display on timer screens
            </p>
          </div>

          {/* Size Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2">Size Controls</h3>
            
            {/* Grid Layout for Size Controls */}
            <div className="grid grid-cols-2 gap-3">
            {/* Timer Size */}
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg">
                <div className="text-white text-sm mb-3 font-medium">Timer Size</div>
                <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => adjustSize('timer', -10)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Decrease timer size"
                >
                    <ZoomOut size={16} />
                </button>
                  <div className="bg-gray-900 px-3 py-2 rounded-lg border border-gray-600 min-w-[50px] text-center">
                    <span className="text-white text-sm font-bold">{sizes.timer}%</span>
                  </div>
                <button
                  onClick={() => adjustSize('timer', 10)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Increase timer size"
                >
                    <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* Alert Size */}
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg">
                <div className="text-white text-sm mb-3 font-medium">Alert Size</div>
                <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => adjustSize('alert', -10)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Decrease alert size"
                >
                    <ZoomOut size={16} />
                </button>
                  <div className="bg-gray-900 px-3 py-2 rounded-lg border border-gray-600 min-w-[50px] text-center">
                    <span className="text-white text-sm font-bold">{sizes.alert}%</span>
                  </div>
                <button
                  onClick={() => adjustSize('alert', 10)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Increase alert size"
                >
                    <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* Alert Speed */}
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg">
                <div className="text-white text-sm mb-3 font-medium">Alert Speed</div>
                <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => adjustSize('alertSpeed', -10)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Decrease alert speed"
                >
                    <FastForward size={16} />
                </button>
                  <div className="bg-gray-900 px-3 py-2 rounded-lg border border-gray-600 min-w-[50px] text-center">
                    <span className="text-white text-sm font-bold">{sizes.alertSpeed}%</span>
                  </div>
                <button
                  onClick={() => adjustSize('alertSpeed', 10)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Increase alert speed"
                >
                    <Rewind size={16} />
                </button>
              </div>
            </div>

            {/* Next Program Size */}
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg">
                <div className="text-white text-sm mb-3 font-medium">Up Next Size</div>
                <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => adjustSize('nextProgram', -10)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Decrease up next size"
                >
                    <ZoomOut size={16} />
                </button>
                  <div className="bg-gray-900 px-3 py-2 rounded-lg border border-gray-600 min-w-[50px] text-center">
                    <span className="text-white text-sm font-bold">{sizes.nextProgram}%</span>
                  </div>
                <button
                  onClick={() => adjustSize('nextProgram', 10)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Increase up next size"
                >
                    <ZoomIn size={16} />
                </button>
              </div>
            </div>

              {/* Clock Size */}
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg">
                <div className="text-white text-sm mb-3 font-medium">Clock Size</div>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => adjustSize('clock', -10)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Decrease clock size"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <div className="bg-gray-900 px-3 py-2 rounded-lg border border-gray-600 min-w-[50px] text-center">
                    <span className="text-white text-sm font-bold">{sizes.clock}%</span>
                  </div>
                  <button
                    onClick={() => adjustSize('clock', 10)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                    title="Increase clock size"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
            <button
              onClick={resetSizes}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center font-medium"
            >
                <RefreshCw className="mr-2" size={18} />
                Reset Sizes
            </button>
            
            {onClearCache && (
              <button
                onClick={onClearCache}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center font-medium"
                title="Clear cache and refresh"
              >
                  <RefreshCw className="mr-2" size={18} />
                Clear Cache
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}