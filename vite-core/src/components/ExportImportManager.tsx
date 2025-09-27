import React, { useState } from 'react';
import { Download, Upload, FileText, X } from 'lucide-react';
import { Program, Category } from '../types';

interface ExportImportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  programs: Program[];
  categories: Category[];
  onImportPrograms: (programs: Program[]) => void;
  onImportCategories: (categories: Category[]) => void;
}

export function ExportImportManager({ 
  isOpen, 
  onClose, 
  programs, 
  categories, 
  onImportPrograms, 
  onImportCategories 
}: ExportImportManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const templateData = [
      ['Program Name', 'Duration (minutes)', 'Category']
    ];
    
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'program_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportPrograms = () => {
    setIsExporting(true);
    
    const exportData = programs.map(program => {
      const category = categories.find(cat => cat.id === program.categoryId);
      return {
        'Program Name': program.name,
        'Duration (minutes)': program.duration,
        'Category': category?.name || 'General'
      };
    });

    const csvContent = [
      ['Program Name', 'Duration (minutes)', 'Category'],
      ...exportData.map(row => [row['Program Name'], row['Duration (minutes)'], row['Category']])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `programs_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('File must contain at least a header row and one data row');
        }

        // Skip header row
        const dataLines = lines.slice(1);
        const importedPrograms: Program[] = [];
        const importedCategories: Category[] = [];
        const categoryMap = new Map<string, string>(); // name -> id

        // Create category map from existing categories
        categories.forEach(cat => {
          categoryMap.set(cat.name.toLowerCase(), cat.id);
        });

        dataLines.forEach((line, index) => {
          // Parse CSV line (simple parsing, handles quoted fields)
          const fields = line.match(/("([^"]*)"|([^,]+))/g)?.map(field => 
            field.replace(/^"|"$/g, '').trim()
          ) || [];

          if (fields.length < 2) {
            throw new Error(`Invalid data on line ${index + 2}: insufficient columns`);
          }

          const [name, durationStr, categoryName] = fields;
          const duration = parseInt(durationStr);

          if (!name || isNaN(duration) || duration <= 0) {
            throw new Error(`Invalid data on line ${index + 2}: invalid name or duration`);
          }

          // Handle category
          let categoryId = '';
          if (categoryName && categoryName.trim()) {
            const normalizedCategoryName = categoryName.trim();
            const lowerCategoryName = normalizedCategoryName.toLowerCase();
            
            if (categoryMap.has(lowerCategoryName)) {
              categoryId = categoryMap.get(lowerCategoryName)!;
            } else {
              // Create new category
              const newCategoryId = `imported_${Date.now()}_${index}`;
              importedCategories.push({
                id: newCategoryId,
                name: normalizedCategoryName
              });
              categoryMap.set(lowerCategoryName, newCategoryId);
              categoryId = newCategoryId;
            }
          } else {
            // Use General category or create it
            const generalId = categoryMap.get('general') || 'general';
            if (generalId === 'general' && !categoryMap.has('general')) {
              importedCategories.push({
                id: 'general',
                name: 'General'
              });
              categoryMap.set('general', 'general');
            }
            categoryId = generalId;
          }

          importedPrograms.push({
            id: `imported_${Date.now()}_${index}`,
            name: name.trim(),
            duration,
            categoryId
          });
        });

        // Import categories first, then programs
        if (importedCategories.length > 0) {
          onImportCategories(importedCategories);
        }
        onImportPrograms(importedPrograms);

        setTimeout(() => {
          setIsImporting(false);
          onClose();
        }, 1000);

      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Unknown error occurred');
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Export/Import Programs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Download Template</h3>
            <p className="text-gray-300 text-sm mb-3">
              Download the Excel template to fill in your program data before importing.
            </p>
            <button
              onClick={downloadTemplate}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 flex items-center justify-center"
            >
              <Download className="mr-2" size={16} />
              Download CSV Template
            </button>
          </div>

          {/* Export Programs */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Export Programs</h3>
            <p className="text-gray-300 text-sm mb-3">
              Export your current program list to a CSV file.
            </p>
            <button
              onClick={exportPrograms}
              disabled={isExporting || programs.length === 0}
              className={`w-full px-4 py-2 rounded flex items-center justify-center ${
                isExporting || programs.length === 0
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500'
              } text-white`}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="mr-2" size={16} />
                  Export Programs ({programs.length})
                </>
              )}
            </button>
          </div>

          {/* Import Programs */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Import Programs</h3>
            <p className="text-gray-300 text-sm mb-3">
              Import programs from a CSV file. Categories will be created automatically if they don't exist.
            </p>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileImport}
              disabled={isImporting}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={`w-full px-4 py-2 rounded flex items-center justify-center cursor-pointer ${
                isImporting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500'
              } text-white`}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={16} />
                  Import from CSV
                </>
              )}
            </label>
          </div>

          {importError && (
            <div className="bg-red-600 text-white p-3 rounded">
              <p className="text-sm">{importError}</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
