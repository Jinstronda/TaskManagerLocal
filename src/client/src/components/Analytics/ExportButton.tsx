import React, { useState } from 'react';
import { Download, FileText, AlertCircle, CheckCircle, ChevronDown, FileJson, FileSpreadsheet } from 'lucide-react';

interface ExportButtonProps {
  onExport: (format?: 'json' | 'csv') => Promise<void>;
  startDate: string;
  endDate: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  startDate,
  endDate
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showFormats, setShowFormats] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');

  const handleExport = async (format: 'json' | 'csv' = selectedFormat) => {
    setIsExporting(true);
    setExportStatus('idle');
    setShowFormats(false);

    try {
      await onExport(format);
      setExportStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setExportStatus('idle');
      }, 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    { 
      value: 'json' as const, 
      label: 'JSON', 
      description: 'Structured data format',
      icon: FileJson,
      extension: '.json'
    },
    { 
      value: 'csv' as const, 
      label: 'CSV', 
      description: 'Spreadsheet compatible',
      icon: FileSpreadsheet,
      extension: '.csv'
    }
  ];

  const getButtonContent = () => {
    if (isExporting) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Exporting...</span>
        </>
      );
    }

    if (exportStatus === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Exported!</span>
        </>
      );
    }

    if (exportStatus === 'error') {
      return (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>Export Failed</span>
        </>
      );
    }

    return (
      <>
        <Download className="w-4 h-4" />
        <span>Export Data</span>
      </>
    );
  };

  const getButtonClass = () => {
    const baseClass = "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    if (exportStatus === 'success') {
      return `${baseClass} bg-green-600 hover:bg-green-700 text-white`;
    }
    
    if (exportStatus === 'error') {
      return `${baseClass} bg-red-600 hover:bg-red-700 text-white`;
    }
    
    return `${baseClass} bg-gray-600 hover:bg-gray-700 text-white`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Export Analytics
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download your analytics data in {selectedFormat.toUpperCase()} format
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowFormats(!showFormats)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <span>{selectedFormat.toUpperCase()}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFormats ? 'rotate-180' : ''}`} />
            </button>
            
            {showFormats && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                {formatOptions.map((format) => {
                  const IconComponent = format.icon;
                  return (
                    <button
                      key={format.value}
                      onClick={() => {
                        setSelectedFormat(format.value);
                        setShowFormats(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                        selectedFormat === format.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {format.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => handleExport()}
            disabled={isExporting}
            className={getButtonClass()}
          >
            {getButtonContent()}
          </button>
        </div>
      </div>

      {/* Export details */}
      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        <p>Export will include:</p>
        <ul className="mt-1 ml-4 list-disc space-y-1">
          <li>Session data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</li>
          <li>Time distribution by categories</li>
          <li>Productivity patterns and statistics</li>
          <li>Category information and goals</li>
          <li>Daily and weekly aggregations</li>
          <li>Focus quality metrics</li>
        </ul>
      </div>

      {exportStatus === 'error' && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to export data. Please try again.
            </p>
          </div>
        </div>
      )}

      {exportStatus === 'success' && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Analytics data exported successfully! Check your downloads folder.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;