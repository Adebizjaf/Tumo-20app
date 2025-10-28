import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookmarkCheck, 
  Download, 
  Trash2, 
  Search,
  ArrowLeftRight,
  Calendar,
  Star,
  StarOff,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { offlineCache } from "@/lib/offline-cache";

interface TranslationHistoryEntry {
  text: string;
  source: string;
  target: string;
  translatedText: string;
  timestamp: number;
  confidence: number;
  provider: string;
  favorite?: boolean;
}

const History = () => {
  const [history, setHistory] = useState<TranslationHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<TranslationHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load history from offline cache
  useEffect(() => {
    loadHistory();
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem("translation_favorites");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const loadHistory = () => {
    const cacheData = offlineCache.exportCache();
    const entries: TranslationHistoryEntry[] = cacheData.map((t) => ({
      text: t.text,
      source: t.source,
      target: t.target,
      translatedText: t.translatedText,
      timestamp: t.timestamp,
      confidence: t.confidence,
      provider: t.provider
    }));
    
    setHistory(entries);
    setFilteredHistory(entries);
  };

  // Filter and search
  useEffect(() => {
    let filtered = [...history];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(entry => 
        entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.translatedText.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Language filter
    if (languageFilter !== "all") {
      filtered = filtered.filter(entry => 
        entry.source === languageFilter || entry.target === languageFilter
      );
    }

    // Sort by timestamp
    filtered.sort((a, b) => {
      return sortOrder === "desc" 
        ? b.timestamp - a.timestamp 
        : a.timestamp - b.timestamp;
    });

    setFilteredHistory(filtered);
  }, [history, searchQuery, languageFilter, sortOrder]);

  const toggleFavorite = (entry: TranslationHistoryEntry) => {
    const key = `${entry.text}-${entry.source}-${entry.target}`;
    const newFavorites = new Set(favorites);
    
    if (favorites.has(key)) {
      newFavorites.delete(key);
    } else {
      newFavorites.add(key);
    }
    
    setFavorites(newFavorites);
    localStorage.setItem("translation_favorites", JSON.stringify([...newFavorites]));
  };

  const isFavorite = (entry: TranslationHistoryEntry) => {
    const key = `${entry.text}-${entry.source}-${entry.target}`;
    return favorites.has(key);
  };

  const deleteEntry = (entry: TranslationHistoryEntry) => {
    // Remove from cache (we'll need to reload)
    // For now, just filter it from display
    const newHistory = history.filter(h => 
      !(h.text === entry.text && h.source === entry.source && h.target === entry.target && h.timestamp === entry.timestamp)
    );
    setHistory(newHistory);
  };

  const clearAllHistory = () => {
    if (confirm("⚠️ Are you sure you want to clear all translation history? This cannot be undone.")) {
      offlineCache.clearCache();
      setHistory([]);
      setFilteredHistory([]);
    }
  };

  const exportHistory = () => {
    const exportData = offlineCache.exportCache();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tumo-translation-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguagePairs = () => {
    const pairs = new Set<string>();
    history.forEach(entry => {
      pairs.add(entry.source);
      pairs.add(entry.target);
    });
    return Array.from(pairs).sort();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const cacheStatus = offlineCache.getStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookmarkCheck className="h-8 w-8 text-primary" />
            Translation History
          </h1>
          <p className="text-muted-foreground mt-2">
            {history.length} translation{history.length !== 1 ? 's' : ''} saved • 
            {' '}{cacheStatus.cacheSize} cached • 
            {' '}{cacheStatus.cacheHits} hits • 
            {' '}{cacheStatus.cacheMisses} misses •
            {' '}{cacheStatus.cacheHits > 0 ? Math.round((cacheStatus.cacheHits / (cacheStatus.cacheHits + cacheStatus.cacheMisses)) * 100) : 0}% hit rate
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportHistory} disabled={history.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" onClick={clearAllHistory} disabled={history.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search translations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-4 py-2 rounded-md border border-input bg-background"
            >
              <option value="all">All Languages</option>
              {getLanguagePairs().map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              {sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card className="p-12 text-center">
          <BookmarkCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {history.length === 0 ? "No translation history yet" : "No results found"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {history.length === 0 
              ? "Start translating to build your history"
              : "Try adjusting your search or filters"}
          </p>
          {history.length === 0 && (
            <Button asChild>
              <a href="/">Start Translating</a>
            </Button>
          )}
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {filteredHistory.map((entry, index) => {
              const favorite = isFavorite(entry);
              
              return (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {entry.source.toUpperCase()}
                        </Badge>
                        <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {entry.target.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.timestamp)}
                        </span>
                        {entry.provider && (
                          <Badge variant="outline" className="text-xs">
                            {entry.provider}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{entry.text}</p>
                        <p className="text-muted-foreground text-sm">{entry.translatedText}</p>
                      </div>
                      
                      {entry.confidence && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${entry.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(entry.confidence * 100)}% confidence
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(entry)}
                        className={favorite ? "text-yellow-500" : ""}
                      >
                        {favorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEntry(entry)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default History;
