import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Category, Program } from '../types';

interface DeleteCategoryConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: Category | null;
  programsInCategory: Program[];
}

export function DeleteCategoryConfirmation({
  isOpen,
  onClose,
  onConfirm,
  category,
  programsInCategory
}: DeleteCategoryConfirmationProps) {
  if (!isOpen || !category) return null;

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
            <div className="bg-red-600 rounded-full p-2">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Delete Category</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Trash2 className="text-red-400 mt-1" size={20} />
              <div>
                <h3 className="text-red-300 font-semibold mb-2">
                  This action cannot be undone!
                </h3>
                <p className="text-red-200 text-sm">
                  Deleting the category <span className="font-semibold">"{category.name}"</span> will permanently remove:
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Category:</span>
                <span className="text-white font-semibold">{category.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Programs in category:</span>
                <span className="text-white font-semibold">{programsInCategory.length}</span>
              </div>
            </div>
          </div>

          {programsInCategory.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Programs that will be deleted:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                {programsInCategory.map((program) => (
                  <div key={program.id} className="text-gray-300 text-sm">
                    • {program.name} ({program.duration} min)
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-yellow-400 mt-1" size={16} />
              <p className="text-yellow-200 text-sm">
                <strong>Warning:</strong> All programs in this category will also be permanently deleted. 
                Make sure you have exported your programs if you need to keep them.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition-colors flex items-center justify-center space-x-2"
          >
            <Trash2 size={18} />
            <span>Delete Category</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
