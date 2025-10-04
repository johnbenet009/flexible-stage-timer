import React, { useState } from 'react';
import { Category, Program } from '../types';
import { X, Edit2, Trash2, Check } from 'lucide-react';
import { DeleteCategoryConfirmation } from './DeleteCategoryConfirmation';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  programs: Program[];
  onAdd: (name: string) => void;
  onUpdate: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryManager({
  isOpen,
  onClose,
  categories,
  programs,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newCategory.trim()) {
      onAdd(newCategory.trim());
      setNewCategory('');
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdate({ id, name: editName.trim() });
      setEditingId(null);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteConfirmation({
      isOpen: true,
      category,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.category) {
      onDelete(deleteConfirmation.category.id);
      setDeleteConfirmation({
        isOpen: false,
        category: null,
      });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      category: null,
    });
  };

  const getProgramsInCategory = (categoryId: string) => {
    return programs.filter(program => program.categoryId === categoryId);
  };

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
          <h2 className="text-xl font-bold text-white">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded"
            />
            <button
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between bg-gray-700 p-3 rounded"
            >
              {editingId === category.id ? (
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-gray-600 text-white px-2 py-1 rounded"
                  />
                  <button
                    onClick={() => saveEdit(category.id)}
                    className="text-green-500 hover:text-green-400"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-white">{category.name}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="text-yellow-500 hover:text-yellow-400"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>

      {deleteConfirmation.isOpen && deleteConfirmation.category && (
        <DeleteCategoryConfirmation
          isOpen={deleteConfirmation.isOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          category={deleteConfirmation.category}
          programsInCategory={getProgramsInCategory(deleteConfirmation.category.id)}
        />
      )}
    </div>
  );
}