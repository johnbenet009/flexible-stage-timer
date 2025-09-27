import React, { useState, useMemo } from 'react';
import { X, Search, Play, Pause, RefreshCw, AlertTriangle, Clock, Settings, Bell, FolderPlus, FileText, Download, Upload, HelpCircle, Timer, List, Eye, Zap, Trash2, Plus } from 'lucide-react';

interface HowToGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  steps: string[];
  keywords: string[];
}

const guideItems: GuideItem[] = [
  {
    id: 'basic-timer',
    title: 'Basic Timer Usage',
    icon: <Timer className="w-5 h-5" />,
    category: 'Getting Started',
    steps: [
      'Use the Setup timer (left side) to prepare your time',
      'Click time adjustment buttons: +1, -1, +5, -5, +10, -10, +30, -30',
      'Click "Start" to transfer time to Live timer',
      'Use Live timer controls: Start, Pause, Stop, Attention'
    ],
    keywords: ['timer', 'basic', 'start', 'setup', 'live', 'controls']
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    icon: <Zap className="w-5 h-5" />,
    category: 'Getting Started',
    steps: [
      'Space: Start/Pause timer',
      'S: Stop timer',
      'R: Reset timer',
      'A: Toggle attention mode',
      'C: Show current time'
    ],
    keywords: ['keyboard', 'shortcuts', 'space', 'keys', 'hotkeys']
  },
  {
    id: 'setup-tabs',
    title: 'Setup Tabs',
    icon: <Settings className="w-5 h-5" />,
    category: 'Interface',
    steps: [
      'Timer Setup tab: Configure your main timer',
      'Extra Time Setup tab: Set up overtime timer',
      'Switch between tabs to access different features'
    ],
    keywords: ['tabs', 'setup', 'timer', 'extra', 'time']
  },
  {
    id: 'live-controls',
    title: 'Live Timer Controls',
    icon: <Play className="w-5 h-5" />,
    category: 'Timer Controls',
    steps: [
      'Start: Begin countdown from setup time',
      'Pause/Resume: Temporarily stop or continue',
      'Stop: End current timer',
      'Attention: Flash attention animation',
      'Time adjustments: +/-1m, +/-5m, +/-10m, +/-5s, +/-10s'
    ],
    keywords: ['live', 'controls', 'start', 'pause', 'stop', 'adjust']
  },
  {
    id: 'program-management',
    title: 'Program Management',
    icon: <List className="w-5 h-5" />,
    category: 'Programs',
    steps: [
      'Enter program name and duration',
      'Select a category from dropdown',
      'Click Save to add to list',
      'Use Start button to run program timer',
      'Use Notify button to show "Up Next" message'
    ],
    keywords: ['programs', 'management', 'add', 'save', 'categories']
  },
  {
    id: 'categories',
    title: 'Categories',
    icon: <FolderPlus className="w-5 h-5" />,
    category: 'Programs',
    steps: [
      'Click "Categories" button in Order of Program',
      'Add new categories with + button',
      'Edit existing categories',
      'Delete categories (with confirmation dialog)',
      'Deleting a category removes all programs in it',
      'Categories help organize your programs'
    ],
    keywords: ['categories', 'organize', 'folders', 'groups', 'delete', 'confirmation']
  },
  {
    id: 'export-import',
    title: 'Export/Import Programs',
    icon: <Download className="w-5 h-5" />,
    category: 'Programs',
    steps: [
      'Click "Export/Import" button',
      'Download CSV template for proper format',
      'Fill template with program data',
      'Import CSV file to add programs',
      'Categories are created automatically if missing'
    ],
    keywords: ['export', 'import', 'csv', 'template', 'backup']
  },
  {
    id: 'timer-history',
    title: 'Timer History',
    icon: <Clock className="w-5 h-5" />,
    category: 'Features',
    steps: [
      'History shows recently run programs',
      'Click "Run Again" to repeat any timer',
      'History auto-expires after 48 hours',
      'Use "Clear All" to remove all history',
      'History appears in right panel'
    ],
    keywords: ['history', 'recent', 'run again', '48 hours']
  },
  {
    id: 'alerts',
    title: 'Alert System',
    icon: <Bell className="w-5 h-5" />,
    category: 'Features',
    steps: [
      'Type message in "Alert message" field',
      'Show Alert: Display message at top',
      'Flash Alert: Animated flashing message',
      'Clear Alert: Remove current alert',
      'Alerts appear on both main and live screens'
    ],
    keywords: ['alerts', 'messages', 'flash', 'notifications']
  },
  {
    id: 'display-settings',
    title: 'Display Settings',
    icon: <Eye className="w-5 h-5" />,
    category: 'Customization',
    steps: [
      'Click Settings button (gear icon)',
      'Upload background images or videos',
      'Use webcam as background',
      'Adjust timer and alert sizes',
      'Set alert scroll speed',
      'Customize splash screen'
    ],
    keywords: ['settings', 'background', 'customize', 'size', 'webcam']
  },
  {
    id: 'multi-screen',
    title: 'Multi-Screen Setup',
    icon: <Eye className="w-5 h-5" />,
    category: 'Display',
    steps: [
      'Connect second monitor (HDMI, VGA, DisplayPort)',
      'App automatically detects secondary screen',
      'Timer display opens on secondary screen',
      'Use File menu to switch displays',
      'Main window stays on primary screen'
    ],
    keywords: ['multi', 'screen', 'display', 'monitor', 'secondary']
  },
  {
    id: 'file-menu',
    title: 'File Menu Options',
    icon: <Settings className="w-5 h-5" />,
    category: 'Interface',
    steps: [
      'Open Timer Display: Show timer on secondary screen',
      'Switch Timer Display: Change to different display',
      'Close Timer Display: Hide timer window',
      'Refresh: Reload application',
      'Clear All Data: Reset app (with confirmation)'
    ],
    keywords: ['file', 'menu', 'display', 'refresh', 'clear']
  },
  {
    id: 'extra-time',
    title: 'Extra Time Feature',
    icon: <Timer className="w-5 h-5" />,
    category: 'Features',
    steps: [
      'Set up extra time in Setup → Extra Time Setup tab',
      'Adjust time using +/- buttons',
      'Start Extra Time when main timer ends',
      'Extra time has distinctive visual display',
      'Use Stop Extra Time to end overtime'
    ],
    keywords: ['extra', 'time', 'overtime', 'additional']
  },
  {
    id: 'next-program',
    title: 'Next Program Notifications',
    icon: <Bell className="w-5 h-5" />,
    category: 'Features',
    steps: [
      'Click "Notify" button on any program',
      'Large "Up Next" message appears',
      'Shows for 5 seconds with animations',
      'Appears on both main and live screens',
      'Great for smooth program transitions'
    ],
    keywords: ['next', 'program', 'notify', 'up next', 'transition']
  },
  {
    id: 'attention-mode',
    title: 'Attention Mode',
    icon: <AlertTriangle className="w-5 h-5" />,
    category: 'Timer Controls',
    steps: [
      'Click "Attention!" button during timer',
      'Triggers attention-grabbing animation',
      'Timer flashes and changes appearance',
      'Automatically stops after 2 seconds',
      'Use keyboard shortcut "A" for quick access'
    ],
    keywords: ['attention', 'flash', 'animation', 'urgent']
  },
  {
    id: 'add-programs',
    title: 'Adding Programs',
    icon: <Plus className="w-5 h-5" />,
    category: 'Programs',
    steps: [
      'Click "Add Program" button in Order section',
      'Clean modal interface opens',
      'Enter program name and select category',
      'Set duration with visual controls',
      'Use +/- buttons or quick duration options',
      'Click "Save Program" to add to list',
      'Success notification shows program saved',
      'Form clears automatically for next program',
      'Modal stays open to add more programs',
      'Program count badges show in each category'
    ],
    keywords: ['add', 'create', 'program', 'modal', 'quick', 'duration', 'notification', 'save', 'count']
  },
  {
    id: 'delete-categories',
    title: 'Delete Categories',
    icon: <Trash2 className="w-5 h-5" />,
    category: 'Categories',
    steps: [
      'Click "Categories" button in Order section',
      'Find category you want to delete',
      'Click delete button (trash icon)',
      'Confirmation dialog appears',
      'Dialog shows all programs that will be deleted',
      'Click "Delete Category" to confirm'
    ],
    keywords: ['delete', 'remove', 'category', 'confirmation', 'warning']
  },
  {
    id: 'program-counts',
    title: 'Program Counts',
    icon: <List className="w-5 h-5" />,
    category: 'Programs',
    steps: [
      'Each category shows a blue badge with program count',
      'Badge displays number of programs in that category',
      'Count updates automatically when programs are added/removed',
      'Helps you quickly see which categories have programs',
      'Useful for organizing and managing large program lists'
    ],
    keywords: ['count', 'badge', 'program', 'category', 'number', 'total']
  },
  {
    id: 'custom-scrollbars',
    title: 'Custom Scrollbars',
    icon: <Settings className="w-5 h-5" />,
    category: 'Interface',
    steps: [
      'All scrollable areas use custom dark-themed scrollbars',
      'Thinner, more elegant design than default scrollbars',
      'Matches the app\'s dark theme perfectly',
      'Hover effects for better user interaction',
      'Applied to program lists, settings, and all modals'
    ],
    keywords: ['scrollbar', 'scroll', 'custom', 'theme', 'dark', 'interface']
  },
  {
    id: 'clear-cache',
    title: 'Clear Cache',
    icon: <RefreshCw className="w-5 h-5" />,
    category: 'Troubleshooting',
    steps: [
      'If updates don\'t appear, clear the app cache',
      'Go to File menu → "Force Refresh (Clear All Cache)"',
      'Or use keyboard shortcut Ctrl+Shift+R',
      'Or click "Clear Cache" button in Live section',
      'This clears cached files and forces reload',
      'Your data (programs, settings) will be preserved',
      'Use "Clear All Data" only if you want to reset everything'
    ],
    keywords: ['cache', 'refresh', 'clear', 'update', 'troubleshoot', 'force']
  },
  {
    id: 'development-workflow',
    title: 'Development Workflow',
    icon: <Settings className="w-5 h-5" />,
    category: 'Troubleshooting',
    steps: [
      'For development: Use "npm run dev" in vite-core folder',
      'For production: Use "npm run build" in main folder',
      'Build process: Compiles React → Copies to public folder → Electron loads',
      'After making changes, always run "npm run build" before "npm start"',
      'This ensures Electron loads the latest version of your app',
      'Development server (npm run dev) is separate from Electron app'
    ],
    keywords: ['development', 'build', 'workflow', 'electron', 'vite', 'production']
  },
  {
    id: 'ui-improvements',
    title: 'UI Improvements',
    icon: <Settings className="w-5 h-5" />,
    category: 'Interface',
    steps: [
      'Top buttons are now smaller and more organized',
      '"Show Clock" changed to "Clock", "How To" to "Guide"',
      'Clear Cache moved to Settings modal for cleaner interface',
      'Settings button is now icon-only to save space',
      '"Up Next" on main display is compact and less intrusive',
      '"Up Next" on live screen has attention-grabbing color sequence',
      'Live screen "Up Next" is much bigger and more visible from distance',
      'Color sequence shows 8 bright colors rapidly for 1.6 seconds',
      'Program counts moved to right side with better styling',
      'Single instance protection prevents multiple app windows'
    ],
    keywords: ['ui', 'interface', 'buttons', 'up next', 'attention', 'colors', 'visibility', 'single instance']
  }
];

export function HowToGuide({ isOpen, onClose }: HowToGuideProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(guideItems.map(item => item.category)))];

  const filteredItems = useMemo(() => {
    let filtered = guideItems;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.steps.some(step => step.toLowerCase().includes(term)) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[90vw] max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <HelpCircle className="text-blue-400" size={28} />
            <h2 className="text-2xl font-bold text-white">How To Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search for help topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none min-w-[150px]"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No results found</h3>
              <p className="text-gray-400">Try different search terms or categories</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-2 bg-blue-600 rounded-lg">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                        <span className="text-sm text-blue-300 bg-blue-900 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                      <ol className="space-y-2">
                        {item.steps.map((step, index) => (
                          <li key={index} className="flex items-start space-x-3 text-gray-300">
                            <span className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white text-sm rounded-full flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Found {filteredItems.length} help topic{filteredItems.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
