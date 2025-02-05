import React, { useState, useEffect, useRef } from 'react';
import { X, Video, Play, Square, ChevronDown, ChevronUp, Radio, Camera, Eye, EyeOff, Image as ImageIcon, FlipHorizontal, RefreshCw, Trash2 } from 'lucide-react';
import Draggable from 'react-draggable';

interface StreamPanelProps {
  onClose: () => void;
}

interface StreamSettings {
  platform: 'facebook' | 'youtube';
  streamKey: string;
  selectedDeviceId?: string;
  mediaFiles?: MediaFile[];
  isCameraFlipped?: boolean;
}

interface MediaFile {
  id: string;
  type: 'image' | 'video';
  data: string;
  width?: number;
  height?: number;
}

const MAX_MEDIA_FILES = 4;
const PYTHON_URL = 'http://localhost:5000/stream';

export function StreamPanel({ onClose }: StreamPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'youtube'>('facebook');
  const [streamKey, setStreamKey] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [isUsingMedia, setIsUsingMedia] = useState(false);
  const [isCameraFlipped, setIsCameraFlipped] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('streamSettings');
    if (savedSettings) {
      try {
        const settings: StreamSettings = JSON.parse(savedSettings);
        setSelectedPlatform(settings.platform || 'facebook');
        setStreamKey(settings.streamKey || '');
        setSelectedDeviceId(settings.selectedDeviceId || '');
        setMediaFiles(settings.mediaFiles || []);
        setIsCameraFlipped(settings.isCameraFlipped || false);
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDeviceId && !isUsingMedia) {
      startPreview();
    }
  }, [selectedDeviceId, isUsingMedia]);

  const loadDevices = async () => {
    setIsLoadingDevices(true);
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No cameras detected');
      }
      
      setDevices(videoDevices);
      if (!selectedDeviceId && videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access camera devices');
      setDevices([]);
      setSelectedDeviceId('');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const checkImageOrientation = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (mediaFiles.length >= MAX_MEDIA_FILES) {
      setError(`Maximum ${MAX_MEDIA_FILES} files allowed. Please delete some files first.`);
      return;
    }

    const remainingSlots = MAX_MEDIA_FILES - mediaFiles.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;

      try {
        if (file.type.startsWith('image/')) {
          const dimensions = await checkImageOrientation(file);
          if (dimensions.width < dimensions.height) {
            setError('Only landscape images are allowed');
            continue;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const newFile: MediaFile = {
              id: Date.now().toString(),
              type: 'image',
              data: reader.result as string,
              width: dimensions.width,
              height: dimensions.height
            };
            setMediaFiles(prev => [...prev, newFile]);
            saveSettings({ mediaFiles: [...mediaFiles, newFile] });
          };
          reader.readAsDataURL(file);
        } else {
          // For video files
          const reader = new FileReader();
          reader.onloadend = () => {
            const newFile: MediaFile = {
              id: Date.now().toString(),
              type: 'video',
              data: reader.result as string
            };
            setMediaFiles(prev => [...prev, newFile]);
            saveSettings({ mediaFiles: [...mediaFiles, newFile] });
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        console.error('Error processing file:', err);
        setError('Error processing file');
      }
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMediaFile = (id: string) => {
    if (selectedMedia?.id === id) {
      setSelectedMedia(null);
      setIsUsingMedia(false);
      if (selectedDeviceId) startPreview();
    }
    setMediaFiles(prev => prev.filter(file => file.id !== id));
    saveSettings({ mediaFiles: mediaFiles.filter(file => file.id !== id) });
  };

  const selectMedia = (file: MediaFile) => {
    setSelectedMedia(file);
    setIsUsingMedia(true);
    stopPreview();
    
    if (videoRef.current) {
      if (file.type === 'image') {
        videoRef.current.style.backgroundImage = `url(${file.data})`;
        videoRef.current.style.backgroundSize = 'cover';
        videoRef.current.style.backgroundPosition = 'center';
      } else {
        videoRef.current.src = file.data;
        videoRef.current.play();
      }
    }
  };

  const toggleCameraFlip = () => {
    const newFlipState = !isCameraFlipped;
    setIsCameraFlipped(newFlipState);
    if (videoRef.current) {
      videoRef.current.style.transform = newFlipState ? 'scaleX(-1)' : 'scaleX(1)';
    }
    saveSettings({ isCameraFlipped: newFlipState });
  };

  const startPreview = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.transform = isCameraFlipped ? 'scaleX(-1)' : 'scaleX(1)';
        videoRef.current.style.backgroundImage = 'none';
      }
      setIsPreviewActive(true);
      setError(null);
    } catch (err) {
      setError('Failed to start camera preview');
      setIsPreviewActive(false);
    }
  };

  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPreviewActive(false);
  };

  const saveSettings = (additionalSettings = {}) => {
    try {
      const settingsToSave: StreamSettings = {
        platform: selectedPlatform,
        streamKey,
        selectedDeviceId,
        mediaFiles,
        isCameraFlipped,
        ...additionalSettings
      };

      Object.keys(settingsToSave).forEach(key => {
        if (settingsToSave[key as keyof StreamSettings] === undefined || 
            settingsToSave[key as keyof StreamSettings] === null) {
          delete settingsToSave[key as keyof StreamSettings];
        }
      });
      
      localStorage.setItem('streamSettings', JSON.stringify(settingsToSave));
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setError(null);
    } catch (err) {
      console.error('Settings save error:', err);
      setError('Failed to save settings');
    }
  };

  const startStream = async () => {
    try {
      if (!isUsingMedia && !selectedDeviceId) {
        throw new Error('No media source selected');
      }

      if (!isUsingMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId }
          }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.style.transform = isCameraFlipped ? 'scaleX(-1)' : 'scaleX(1)';
        }
      }
      
      setIsStreaming(true);
      setError(null);

      const streamId = Date.now().toString();

      const response = await fetch(PYTHON_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId,
          platform: selectedPlatform,
          streamKey,
          inputUrl: `webrtc://localhost/${streamId}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start stream');
      }

      localStorage.setItem('currentStreamId', streamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start stream');
      stopStream();
    }
  };

  const stopStream = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const streamId = localStorage.getItem('currentStreamId');
    if (streamId) {
      try {
        await fetch(`${PYTHON_URL}/${streamId}`, {
          method: 'DELETE',
        });
        localStorage.removeItem('currentStreamId');
      } catch (err) {
        setError('Failed to stop remote stream');
      }
    }

    setIsStreaming(false);
    setIsUsingMedia(false);
    if (selectedDeviceId) {
      startPreview();
    }
  };

  const switchToCamera = () => {
    setIsUsingMedia(false);
    setSelectedMedia(null);
    if (videoRef.current) {
      videoRef.current.style.backgroundImage = 'none';
      if (selectedDeviceId) {
        startPreview();
      }
    }
  };

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div ref={nodeRef} className="fixed bottom-4 left-4 w-[800px] bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div 
          className={`handle flex items-center justify-between p-3 cursor-move transition-colors duration-300
            ${error ? 'bg-red-700' : isStreaming ? 'bg-green-700' : 'bg-gray-700'}`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            setIsCollapsed(!isCollapsed);
          }}
        >
          <div className="flex items-center space-x-2">
            <h3 className="text-white font-bold">Stream Panel</h3>
            {isStreaming && (
              <div className="animate-pulse">
                <Radio size={16} className="text-red-500" />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isCollapsed ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-600 text-white px-4 py-2 text-sm flex items-center justify-between">
            <span>{error}</span>
            {error.includes('No cameras') && (
              <button
                onClick={loadDevices}
                disabled={isLoadingDevices}
                className="flex items-center space-x-1 bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs"
              >
                <RefreshCw size={12} className={isLoadingDevices ? 'animate-spin' : ''} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {showSaveSuccess && (
          <div className="bg-green-600 text-white px-4 py-2 text-sm">
            Settings saved successfully!
          </div>
        )}

        {!isCollapsed && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - Preview */}
              <div className="space-y-4">
                <div className="aspect-video bg-gray-900 rounded overflow-hidden relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    loop={selectedMedia?.type === 'video'}
                    className={`w-full h-full object-cover ${!isPreviewActive && !isStreaming && !isUsingMedia ? 'hidden' : ''}`}
                  />
                  {!isPreviewActive && !isStreaming && !isUsingMedia && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Camera size={48} className="mb-2" />
                      <p className="text-sm">No media source selected</p>
                    </div>
                  )}
                  {(isPreviewActive || isStreaming || isUsingMedia) && (
                    <div className="absolute top-2 right-2 flex space-x-2">
                      {!isUsingMedia && (
                        <>
                          {isPreviewActive && !isStreaming && (
                            <button
                              onClick={stopPreview}
                              className="px-3 py-1 bg-red-600 text-white rounded-full text-sm hover:bg-red-500 flex items-center space-x-1"
                            >
                              <EyeOff size={14} />
                              <span>Stop Preview</span>
                            </button>
                          )}
                          <button
                            onClick={toggleCameraFlip}
                            className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-500 flex items-center space-x-1"
                          >
                            <FlipHorizontal size={14} />
                            <span>Flip</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-white">Media Files ({mediaFiles.length}/{MAX_MEDIA_FILES})</h4>
                  </div>
                  <div className="max-h-24 overflow-x-auto">
                    <div className="flex space-x-2">
                      {mediaFiles.map(file => (
                        <div key={file.id} className="relative group">
                          {file.type === 'image' ? (
                            <img
                              src={file.data}
                              alt=""
                              className={`h-20 w-auto object-cover cursor-pointer rounded ${
                                selectedMedia?.id === file.id ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => selectMedia(file)}
                            />
                          ) : (
                            <video
                              src={file.data}
                              className={`h-20 w-auto object-cover cursor-pointer rounded ${
                                selectedMedia?.id === file.id ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => selectMedia(file)}
                            />
                          )}
                          <button
                            onClick={() => removeMediaFile(file.id)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {!isStreaming ? (
                    <button
                      onClick={startStream}
                      disabled={(!streamKey || (!selectedDeviceId && !selectedMedia))}
                      className={`w-full rounded px-4 py-2 flex items-center justify-center space-x-2
                        ${(streamKey && (selectedDeviceId || selectedMedia))
                          ? 'bg-green-600 hover:bg-green-500 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Play size={20} />
                      <span>Start Stream</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopStream}
                      className="w-full bg-red-600 text-white rounded px-4 py-2 hover:bg-red-500 flex items-center justify-center space-x-2"
                    >
                      <Square size={20} />
                      <span>Stop Stream</span>
                    </button>
                  )}
                </div>

                {isStreaming && (
                  <div className="flex space-x-2">
                    <button
                      onClick={switchToCamera}
                      disabled={!selectedDeviceId}
                      className={`flex-1 rounded px-4 py-2 flex items-center justify-center space-x-2 
                        ${selectedDeviceId 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                    >
                      <Camera size={18} />
                      <span>Switch to Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column - Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Camera
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="flex-1 bg-gray-700 text-white rounded px-3 py-2"
                      onClick={() => loadDevices()}
                    >
                      <option value="">Select camera...</option>
                      {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={loadDevices}
                      disabled={isLoadingDevices}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={18} className={isLoadingDevices ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Images/Mp4
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={mediaFiles.length >= MAX_MEDIA_FILES}
                      className={`flex-1 px-4 py-2 rounded flex items-center justify-center space-x-2
                        ${mediaFiles.length >= MAX_MEDIA_FILES
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-500'
                        }`}
                    >
                      <ImageIcon size={18} />
                      <span>Upload Media {mediaFiles.length}/{MAX_MEDIA_FILES}</span>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <p className="text-xs text-gray-400">
                    Note: Only landscape images are allowed. Maximum {MAX_MEDIA_FILES} files.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Streaming Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as 'facebook' | 'youtube')}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Stream Key
                  </label>
                  <div className="relative">
                    <input
                      type={showStreamKey ? "text" : "password"}
                      value={streamKey}
                      onChange={(e) => setStreamKey(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded px-3 py-2 pr-10"
                      placeholder="Enter stream key"
                    />
                    <button
                      onClick={() => setShowStreamKey(!showStreamKey)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showStreamKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => saveSettings()}
                  className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-500"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
}