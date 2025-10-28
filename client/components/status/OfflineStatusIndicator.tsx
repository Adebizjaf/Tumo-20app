import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Download, 
  Upload, 
  Trash2,
  Info 
} from 'lucide-react';
import { offlineCache, getNetworkStatus, isOffline } from '@/lib/offline-cache';
import { cn } from '@/lib/utils';

export const OfflineStatusIndicator = () => {
  const [networkStatus, setNetworkStatus] = useState(getNetworkStatus());
  const [isOfflineMode, setIsOfflineMode] = useState(isOffline());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setNetworkStatus(getNetworkStatus());
      setIsOfflineMode(isOffline());
    };

    // Update status every second
    const interval = setInterval(updateStatus, 1000);

    // Listen for network changes
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const handleClearCache = () => {
    offlineCache.clearCache();
    setNetworkStatus(getNetworkStatus());
  };

  const handleExportCache = () => {
    const cache = offlineCache.exportCache();
    const dataStr = JSON.stringify(cache, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tumo-translations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cacheHitRate = networkStatus.cacheHits + networkStatus.cacheMisses > 0 
    ? (networkStatus.cacheHits / (networkStatus.cacheHits + networkStatus.cacheMisses) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge 
          variant={isOfflineMode ? "destructive" : "default"}
          className={cn(
            "flex items-center gap-1 transition-colors",
            isOfflineMode ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
          )}
        >
          {isOfflineMode ? (
            <WifiOff className="h-3 w-3" />
          ) : (
            <Wifi className="h-3 w-3" />
          )}
          {isOfflineMode ? 'Offline Mode' : 'Online'}
        </Badge>

        {networkStatus.cacheSize > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {networkStatus.cacheSize} cached
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="h-6 px-2"
        >
          <Info className="h-3 w-3" />
        </Button>
      </div>

      {/* Detailed Status Card */}
      {showDetails && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Offline Cache Status</h4>
              <Badge variant="outline" className="text-xs">
                {cacheHitRate}% hit rate
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground">Cached Translations</div>
                <div className="font-medium">{networkStatus.cacheSize}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cache Hits</div>
                <div className="font-medium text-green-600">{networkStatus.cacheHits}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cache Misses</div>
                <div className="font-medium text-orange-600">{networkStatus.cacheMisses}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Online</div>
                <div className="font-medium">
                  {isOfflineMode ? (
                    `${Math.floor((Date.now() - networkStatus.lastOnlineTime) / 1000 / 60)}m ago`
                  ) : (
                    'Now'
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCache}
                disabled={networkStatus.cacheSize === 0}
                className="flex items-center gap-1 text-xs h-7"
              >
                <Download className="h-3 w-3" />
                Export Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={networkStatus.cacheSize === 0}
                className="flex items-center gap-1 text-xs h-7 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
                Clear Cache
              </Button>
            </div>

            {isOfflineMode && (
              <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  <strong>Offline Mode Active:</strong> Using cached translations and offline dictionary. 
                  New translations will be cached when you go back online.
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default OfflineStatusIndicator;