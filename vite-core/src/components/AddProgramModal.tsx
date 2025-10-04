import { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, Clock, CheckCircle } from 'lucide-react';
import { Program, Category } from '../types';

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (program: Omit<Program, 'id'>) => void;
  categories: Category[];
  initialCategory?: string;
}

export function AddProgramModal({ isOpen, onClose, onSave, categories, initialCategory }: AddProgramModalProps) {
  const [programName, setProgramName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [duration, setDuration] = useState(5);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [savedProgramName, setSavedProgramName] = useState('');
  const [savedCategoryName, setSavedCategoryName] = useState('');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const handleSave = () => {
    if (programName.trim() && selectedCategory) {
      const category = categories.find(cat => cat.id === selectedCategory);
      
      onSave({
        name: programName.trim(),
        duration,
        categoryId: selectedCategory
      });
      
      // Store saved program info for notification
      setSavedProgramName(programName.trim());
      setSavedCategoryName(category?.name || 'Unknown');
      
      // Reset form but keep modal open
      setProgramName('');
      setDuration(5);
      setSelectedCategory(initialCategory || '');
      
      // Show success notification
      setShowSuccessNotification(true);
      
      // Auto-hide notification after 2 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 2000);
    }
  };

  const adjustDuration = (amount: number) => {
    setDuration(prev => Math.max(1, prev + amount));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plus className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Add Program</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Program Name */}
          <div>
            <label className="block text-white font-medium mb-2">Program Name</label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="Enter program name"
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-white font-medium mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-white font-medium mb-3">Duration</label>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-4 mb-3">
                <button
                  onClick={() => adjustDuration(-5)}
                  className="w-12 h-12 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition-colors"
                  disabled={duration <= 5}
                >
                  <Minus size={20} />
                </button>
                <button
                  onClick={() => adjustDuration(-1)}
                  className="w-12 h-12 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition-colors"
                  disabled={duration <= 1}
                >
                  -1
                </button>
                
                <div className="flex items-center space-x-2 bg-gray-600 rounded-lg px-4 py-2">
                  <Clock className="text-blue-400" size={20} />
                  <span className="text-2xl font-bold text-white">{duration}</span>
                  <span className="text-gray-300">min</span>
                </div>
                
                <button
                  onClick={() => adjustDuration(1)}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  +1
                </button>
                <button
                  onClick={() => adjustDuration(5)}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  +5
                </button>
              </div>
              
              {/* Quick Duration Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 15].map(minutes => (
                  <button
                    key={minutes}
                    onClick={() => setDuration(minutes)}
                    className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                      duration === minutes
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={!programName.trim() || !selectedCategory}
            className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
              !programName.trim() || !selectedCategory
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            <Save size={18} />
            <span>Save</span>
          </button>
        </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-slideInFromTopNotification">
            <CheckCircle size={24} className="text-green-200" />
            <div>
              <div className="font-semibold">Program Saved!</div>
              <div className="text-sm text-green-200">
                "{savedProgramName}" added to <span className="font-medium">{savedCategoryName}</span> category
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
