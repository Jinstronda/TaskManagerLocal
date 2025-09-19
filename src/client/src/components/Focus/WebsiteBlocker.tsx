import React, { useState, useEffect } from 'react';
import { Shield, ShieldOff, Plus, X, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface BlockedWebsite {
  id: string;
  url: string;
  category: 'social' | 'entertainment' | 'news' | 'shopping' | 'custom';
  isActive: boolean;
  addedAt: Date;
}

interface WebsiteBlockerProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  sessionDuration?: number; // minutes
}

/**
 * Website blocker component for focus mode
 * Provides interface to block distracting websites during focus sessions
 */
const WebsiteBlocker: React.FC<WebsiteBlockerProps> = ({
  isEnabled,
  onToggle,
  sessionDuration,
}) => {
  const [blockedWebsites, setBlockedWebsites] = useState<BlockedWebsite[]>([]);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlockedWebsite['category']>('custom');
  const [showAddForm, setShowAddForm] = useState(false);
  const [blockingStats, setBlockingStats] = useState({
    blockedAttempts: 0,
    timesSaved: 0, // minutes
    lastBlockedSite: null as string | null,
  });

  // Predefined website categories with common distracting sites
  const websiteCategories = {
    social: {
      name: 'Social Media',
      icon: '👥',
      color: 'bg-blue-500',
      sites: [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'linkedin.com',
        'tiktok.com',
        'snapchat.com',
        'reddit.com',
      ],
    },
    entertainment: {
      name: 'Entertainment',
      icon: '🎬',
      color: 'bg-purple-500',
      sites: [
        'youtube.com',
        'netflix.com',
        'twitch.tv',
        'hulu.com',
        'disney.com',
        'spotify.com',
        'soundcloud.com',
      ],
    },
    news: {
      name: 'News & Media',
      icon: '📰',
      color: 'bg-orange-500',
      sites: [
        'cnn.com',
        'bbc.com',
        'nytimes.com',
        'washingtonpost.com',
        'reuters.com',
        'bloomberg.com',
      ],
    },
    shopping: {
      name: 'Shopping',
      icon: '🛒',
      color: 'bg-green-500',
      sites: [
        'amazon.com',
        'ebay.com',
        'etsy.com',
        'walmart.com',
        'target.com',
        'bestbuy.com',
      ],
    },
    custom: {
      name: 'Custom',
      icon: '⚙️',
      color: 'bg-gray-500',
      sites: [],
    },
  };

  // Load blocked websites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('blockedWebsites');
    if (saved) {
      try {
        const websites = JSON.parse(saved);
        setBlockedWebsites(websites);
      } catch (error) {
        console.error('Failed to load blocked websites:', error);
      }
    }
  }, []);

  // Save blocked websites to localStorage
  useEffect(() => {
    localStorage.setItem('blockedWebsites', JSON.stringify(blockedWebsites));
  }, [blockedWebsites]);

  // Mock blocking simulation (in real implementation, this would integrate with browser extensions or system-level blocking)
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      // Simulate random blocking attempts for demonstration
      if (Math.random() > 0.8 && blockedWebsites.length > 0) {
        const randomSite = blockedWebsites[Math.floor(Math.random() * blockedWebsites.length)];
        setBlockingStats(prev => ({
          ...prev,
          blockedAttempts: prev.blockedAttempts + 1,
          timesSaved: prev.timesSaved + Math.floor(Math.random() * 5) + 1,
          lastBlockedSite: randomSite.url,
        }));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isEnabled, blockedWebsites]);

  // Add website to block list
  const handleAddWebsite = () => {
    if (!newWebsiteUrl.trim()) return;

    // Clean up URL
    let cleanUrl = newWebsiteUrl.trim().toLowerCase();
    if (!cleanUrl.includes('.')) {
      cleanUrl += '.com';
    }
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    }
    if (cleanUrl.startsWith('www.')) {
      cleanUrl = cleanUrl.replace(/^www\./, '');
    }

    // Check if already exists
    if (blockedWebsites.some(site => site.url === cleanUrl)) {
      return;
    }

    const newWebsite: BlockedWebsite = {
      id: `site_${Date.now()}`,
      url: cleanUrl,
      category: selectedCategory,
      isActive: true,
      addedAt: new Date(),
    };

    setBlockedWebsites(prev => [...prev, newWebsite]);
    setNewWebsiteUrl('');
    setShowAddForm(false);
  };

  // Remove website from block list
  const handleRemoveWebsite = (websiteId: string) => {
    setBlockedWebsites(prev => prev.filter(site => site.id !== websiteId));
  };

  // Toggle website active state
  const handleToggleWebsite = (websiteId: string) => {
    setBlockedWebsites(prev =>
      prev.map(site =>
        site.id === websiteId ? { ...site, isActive: !site.isActive } : site
      )
    );
  };

  // Add predefined category sites
  const handleAddCategorySites = (category: keyof typeof websiteCategories) => {
    const categoryData = websiteCategories[category];
    const newSites = categoryData.sites
      .filter(url => !blockedWebsites.some(site => site.url === url))
      .map(url => ({
        id: `site_${Date.now()}_${url}`,
        url,
        category,
        isActive: true,
        addedAt: new Date(),
      }));

    setBlockedWebsites(prev => [...prev, ...newSites]);
  };

  // Get category info
  const getCategoryInfo = (category: BlockedWebsite['category']) => {
    return websiteCategories[category];
  };

  // Group websites by category
  const websitesByCategory = blockedWebsites.reduce((acc, website) => {
    if (!acc[website.category]) {
      acc[website.category] = [];
    }
    acc[website.category].push(website);
    return acc;
  }, {} as Record<string, BlockedWebsite[]>);

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          {isEnabled ? (
            <Shield className="w-5 h-5 text-orange-600" />
          ) : (
            <ShieldOff className="w-5 h-5 text-gray-600" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">Website Blocking</h3>
            <p className="text-sm text-gray-600">
              {isEnabled
                ? `Blocking ${blockedWebsites.filter(s => s.isActive).length} websites`
                : 'Website blocking disabled'
              }
            </p>
          </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
        </label>
      </div>

      {/* Blocking statistics */}
      {isEnabled && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {blockingStats.blockedAttempts}
            </div>
            <div className="text-sm text-red-700">Sites blocked</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {blockingStats.timesSaved}
            </div>
            <div className="text-sm text-green-700">Minutes saved</div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {blockedWebsites.filter(s => s.isActive).length}
            </div>
            <div className="text-sm text-blue-700">Active blocks</div>
          </div>
        </div>
      )}

      {/* Last blocked site notification */}
      {isEnabled && blockingStats.lastBlockedSite && (
        <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              Recently blocked: {blockingStats.lastBlockedSite}
            </p>
            <p className="text-xs text-orange-600">
              Stay focused! You're doing great.
            </p>
          </div>
        </div>
      )}

      {/* Quick category additions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Quick Add Categories</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(websiteCategories).map(([key, category]) => {
            if (key === 'custom') return null;
            
            const categoryKey = key as keyof typeof websiteCategories;
            const existingSites = blockedWebsites.filter(s => s.category === categoryKey).length;
            const totalSites = category.sites.length;
            
            return (
              <button
                key={key}
                onClick={() => handleAddCategorySites(categoryKey)}
                disabled={existingSites === totalSites}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  existingSites === totalSites
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium text-sm text-gray-900">
                      {category.name}
                    </span>
                  </div>
                  {existingSites === totalSites && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {existingSites}/{totalSites} sites added
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add custom website */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Custom Websites</h4>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Website</span>
          </button>
        </div>
        
        {showAddForm && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Website URL</label>
              <input
                type="text"
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                placeholder="example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddWebsite()}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as BlockedWebsite['category'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(websiteCategories).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddWebsite}
                disabled={!newWebsiteUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Website
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewWebsiteUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Blocked websites list */}
      {blockedWebsites.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Blocked Websites</h4>
          
          {Object.entries(websitesByCategory).map(([category, websites]) => {
            const categoryInfo = getCategoryInfo(category as BlockedWebsite['category']);
            
            return (
              <div key={category} className="border border-gray-200 rounded-lg">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{categoryInfo.icon}</span>
                    <span className="font-medium text-sm text-gray-900">
                      {categoryInfo.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({websites.length} sites)
                    </span>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {websites.map((website) => (
                    <div
                      key={website.id}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={website.isActive}
                            onChange={() => handleToggleWebsite(website.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                        
                        <div>
                          <p className={`text-sm font-medium ${
                            website.isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {website.url}
                          </p>
                          <p className="text-xs text-gray-500">
                            Added {website.addedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveWebsite(website.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove website"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session timer integration */}
      {isEnabled && sessionDuration && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Session Protection Active
            </span>
          </div>
          <p className="text-xs text-blue-600">
            Websites will be blocked for the next {sessionDuration} minutes during your focus session.
          </p>
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        <p>
          <strong>Note:</strong> Website blocking requires a browser extension or system-level 
          blocking tool to be fully effective. This interface provides the configuration 
          that would integrate with such tools.
        </p>
      </div>
    </div>
  );
};

export default WebsiteBlocker;