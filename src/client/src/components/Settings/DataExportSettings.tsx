import React, { useState } from 'react';
import { Download, Upload, Database, FileText, Calendar, Shield, AlertTriangle } from 'lucide-react';

export const DataExportSettings: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportData, setExportData] = useState({
    sessions: true,
    tasks: true,
    categories: true,
    settings: true,
    analytics: true
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create export data
      const exportPayload = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          ...(exportData.sessions && { sessions: [] }),
          ...(exportData.tasks && { tasks: [] }),
          ...(exportData.categories && { categories: [] }),
          ...(exportData.settings && { settings: {} }),
          ...(exportData.analytics && { analytics: {} })
        }
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: exportFormat === 'json' ? 'application/json' : 'text/csv'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-tracker-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate import data structure
      if (!data.version || !data.data) {
        throw new Error('Invalid export file format');
      }
      
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Import data:', data);
      // Here you would actually import the data to your stores/database
      
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const exportOptions = [
    {
      key: 'sessions' as const,
      name: 'Focus Sessions',
      description: 'All your completed focus sessions and time tracking data',
      icon: Calendar,
      size: '~2-5MB for 1 year of data'
    },
    {
      key: 'tasks' as const,
      name: 'Tasks & Projects',
      description: 'Tasks, categories, and project organization',
      icon: FileText,
      size: '~100KB-1MB typical'
    },
    {
      key: 'categories' as const,
      name: 'Categories',
      description: 'Custom categories with colors and goals',
      icon: Database,
      size: '~1-10KB'
    },
    {
      key: 'settings' as const,
      name: 'App Settings',
      description: 'Preferences, themes, and configuration',
      icon: Shield,
      size: '~1-5KB'
    },
    {
      key: 'analytics' as const,
      name: 'Analytics Data',
      description: 'Productivity insights and statistics',
      icon: Database,
      size: '~500KB-2MB'
    }
  ];

  const totalSelectedSize = exportOptions
    .filter(option => exportData[option.key])
    .length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <Database className="w-5 h-5 text-green-600" />
          <span>Data Export & Backup</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Export your data for backup or transfer to another device
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
              Your Data Stays Private
            </h4>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              All exports are generated locally on your device. No data is sent to external servers.
            </p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Download className="w-4 h-4 text-blue-600" />
          <span>Export Data</span>
        </h3>

        {/* Export Format */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExportFormat('json')}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                exportFormat === 'json'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`font-medium text-sm ${
                exportFormat === 'json' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                JSON
              </div>
              <div className={`text-xs ${
                exportFormat === 'json' 
                  ? 'text-blue-500 dark:text-blue-500' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Complete data with structure
              </div>
            </button>
            
            <button
              onClick={() => setExportFormat('csv')}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                exportFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`font-medium text-sm ${
                exportFormat === 'csv' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                CSV
              </div>
              <div className={`text-xs ${
                exportFormat === 'csv' 
                  ? 'text-blue-500 dark:text-blue-500' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Spreadsheet compatible
              </div>
            </button>
          </div>
        </div>

        {/* Data Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Data to Export
          </label>
          <div className="space-y-2">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = exportData[option.key];
              
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {option.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {option.size}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => setExportData(prev => ({
                        ...prev,
                        [option.key]: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <strong>{totalSelectedSize}</strong> data types selected for export
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Export will be saved as: task-tracker-export-{new Date().toISOString().split('T')[0]}.{exportFormat}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting || totalSelectedSize === 0}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                   transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center space-x-2"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </>
          )}
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Upload className="w-4 h-4 text-orange-600" />
          <span>Import Data</span>
        </h3>

        {/* Warning */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Import Warning
              </h4>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Importing data will merge with your existing data. Some settings may be overwritten. 
                Consider exporting your current data first as a backup.
              </p>
            </div>
          </div>
        </div>

        {/* Import Button */}
        <div className="space-y-4">
          <label className="block">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
            <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 
                          rounded-lg text-center cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 
                          transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isImporting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-orange-600 dark:text-orange-400">Importing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Click to select export file (.json or .csv)
                  </span>
                </div>
              )}
            </div>
          </label>

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Only import files that were exported from Local Task Tracker
          </div>
        </div>
      </div>

      {/* Backup Tips */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Backup Best Practices
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Export your data regularly (weekly or monthly)</li>
          <li>• Store backups in multiple locations (cloud storage, external drive)</li>
          <li>• Test your backups by importing them on a test device</li>
          <li>• Keep multiple backup versions in case of data corruption</li>
          <li>• Export before major app updates or system changes</li>
        </ul>
      </div>
    </div>
  );
};