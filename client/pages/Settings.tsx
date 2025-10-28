import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon,
  ShieldCheck, 
  Smartphone, 
  Wifi,
  Globe,
  Moon,
  Sun,
  Volume2,
  Lock,
  Database,
  Zap,
  Cloud,
  AlertCircle,
  CheckCircle2,
  Laptop,
  Tablet,
  Watch,
  RefreshCw,
  Save,
  RotateCcw
} from "lucide-react";
import { useTheme } from "next-themes";

interface SettingsState {
  // Privacy Settings
  onDeviceOnly: boolean;
  anonymousAnalytics: boolean;
  encryptionEnabled: boolean;
  dataSharingOptOut: boolean;
  
  // Translation Defaults
  autoDetectLanguage: boolean;
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  showConfidenceScores: boolean;
  enableOfflineMode: boolean;
  
  // Audio Settings
  enableTextToSpeech: boolean;
  ttsSpeed: number;
  ttsVolume: number;
  autoPlayTranslations: boolean;
  
  // Network Settings
  bandwidthProfile: 'low' | 'medium' | 'high' | 'unlimited';
  adaptiveStreaming: boolean;
  maxLatency: number;
  offlineFirst: boolean;
  
  // Device Handoff
  deviceHandoffEnabled: boolean;
  pairedDevices: string[];
  syncTranslationHistory: boolean;
  syncFavorites: boolean;
  
  // Enterprise Features
  enterpriseMode: boolean;
  apiKeyCustom: string;
  customEndpoint: string;
  featureFlags: {
    betaFeatures: boolean;
    experimentalUI: boolean;
    advancedStats: boolean;
  };
}

const defaultSettings: SettingsState = {
  onDeviceOnly: false,
  anonymousAnalytics: true,
  encryptionEnabled: true,
  dataSharingOptOut: false,
  
  autoDetectLanguage: true,
  defaultSourceLanguage: 'en',
  defaultTargetLanguage: 'es',
  showConfidenceScores: true,
  enableOfflineMode: true,
  
  enableTextToSpeech: true,
  ttsSpeed: 1.0,
  ttsVolume: 0.8,
  autoPlayTranslations: false,
  
  bandwidthProfile: 'medium',
  adaptiveStreaming: true,
  maxLatency: 5000,
  offlineFirst: true,
  
  deviceHandoffEnabled: false,
  pairedDevices: [],
  syncTranslationHistory: true,
  syncFavorites: true,
  
  enterpriseMode: false,
  apiKeyCustom: '',
  customEndpoint: '',
  featureFlags: {
    betaFeatures: false,
    experimentalUI: false,
    advancedStats: false,
  },
};

const Settings = () => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const { theme, setTheme } = useTheme();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('tumo_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateFeatureFlag = (flag: keyof SettingsState['featureFlags'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      featureFlags: { ...prev.featureFlags, [flag]: value }
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    setSaveStatus('saving');
    localStorage.setItem('tumo_settings', JSON.stringify(settings));
    
    setTimeout(() => {
      setSaveStatus('saved');
      setHasChanges(false);
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500);
  };

  const resetSettings = () => {
    if (confirm('⚠️ Reset all settings to default? This cannot be undone.')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  const getNetworkStatusColor = () => {
    switch (settings.bandwidthProfile) {
      case 'low': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-green-500';
      case 'unlimited': return 'text-blue-500';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings & Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your translation experience, privacy controls, and synchronization
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button 
            onClick={saveSettings}
            disabled={!hasChanges || saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="network">
            <Wifi className="h-4 w-4 mr-2" />
            Network
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Smartphone className="h-4 w-4 mr-2" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="enterprise">
            <Zap className="h-4 w-4 mr-2" />
            Enterprise
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Translation Defaults
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-detect Language</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect source language
                  </p>
                </div>
                <Switch
                  checked={settings.autoDetectLanguage}
                  onCheckedChange={(checked) => updateSetting('autoDetectLanguage', checked)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Source Language</Label>
                  <select
                    value={settings.defaultSourceLanguage}
                    onChange={(e) => updateSetting('defaultSourceLanguage', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                    disabled={settings.autoDetectLanguage}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="pt">Portuguese</option>
                    <option value="it">Italian</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Default Target Language</Label>
                  <select
                    value={settings.defaultTargetLanguage}
                    onChange={(e) => updateSetting('defaultTargetLanguage', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="pt">Portuguese</option>
                    <option value="it">Italian</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Confidence Scores</Label>
                  <p className="text-sm text-muted-foreground">
                    Display translation confidence percentages
                  </p>
                </div>
                <Switch
                  checked={settings.showConfidenceScores}
                  onCheckedChange={(checked) => updateSetting('showConfidenceScores', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Offline Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use cached translations when offline
                  </p>
                </div>
                <Switch
                  checked={settings.enableOfflineMode}
                  onCheckedChange={(checked) => updateSetting('enableOfflineMode', checked)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Text-to-Speech</Label>
                  <p className="text-sm text-muted-foreground">
                    Speak translations aloud
                  </p>
                </div>
                <Switch
                  checked={settings.enableTextToSpeech}
                  onCheckedChange={(checked) => updateSetting('enableTextToSpeech', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Speech Speed: {settings.ttsSpeed.toFixed(1)}x</Label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.ttsSpeed}
                  onChange={(e) => updateSetting('ttsSpeed', parseFloat(e.target.value))}
                  className="w-full"
                  disabled={!settings.enableTextToSpeech}
                />
              </div>

              <div className="space-y-2">
                <Label>Volume: {Math.round(settings.ttsVolume * 100)}%</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.ttsVolume}
                  onChange={(e) => updateSetting('ttsVolume', parseFloat(e.target.value))}
                  className="w-full"
                  disabled={!settings.enableTextToSpeech}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-play Translations</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically speak translations in conversations
                  </p>
                </div>
                <Switch
                  checked={settings.autoPlayTranslations}
                  onCheckedChange={(checked) => updateSetting('autoPlayTranslations', checked)}
                  disabled={!settings.enableTextToSpeech}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="flex-1"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="flex-1"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="flex-1"
                  >
                    <Laptop className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Privacy Presets
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    On-Device Only Processing
                    <Badge variant="secondary">Advanced</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Process translations locally without sending data to servers
                  </p>
                </div>
                <Switch
                  checked={settings.onDeviceOnly}
                  onCheckedChange={(checked) => updateSetting('onDeviceOnly', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Anonymized Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve the app with anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={settings.anonymousAnalytics}
                  onCheckedChange={(checked) => updateSetting('anonymousAnalytics', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    End-to-End Encryption
                    <Badge variant="default">Recommended</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt all translation data at rest and in transit
                  </p>
                </div>
                <Switch
                  checked={settings.encryptionEnabled}
                  onCheckedChange={(checked) => updateSetting('encryptionEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Opt-out of Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Don't share translation data with third-party services
                  </p>
                </div>
                <Switch
                  checked={settings.dataSharingOptOut}
                  onCheckedChange={(checked) => updateSetting('dataSharingOptOut', checked)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Privacy Notice
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your translation history is stored locally on your device. Translations are sent to LibreTranslate API for processing. 
                  Enable "On-Device Only Processing" for complete privacy, though this may limit translation quality for some languages.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Network Settings */}
        <TabsContent value="network" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wifi className={`h-5 w-5 ${getNetworkStatusColor()}`} />
              Network Profiles
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bandwidth Profile</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'unlimited'] as const).map((profile) => (
                    <Button
                      key={profile}
                      variant={settings.bandwidthProfile === profile ? 'default' : 'outline'}
                      onClick={() => updateSetting('bandwidthProfile', profile)}
                      className="capitalize"
                    >
                      {profile}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.bandwidthProfile === 'low' && 'Optimize for slow connections (text only)'}
                  {settings.bandwidthProfile === 'medium' && 'Balanced performance (recommended)'}
                  {settings.bandwidthProfile === 'high' && 'Fast translations with audio'}
                  {settings.bandwidthProfile === 'unlimited' && 'Maximum quality, no restrictions'}
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Adaptive Streaming</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically adjust quality based on connection speed
                  </p>
                </div>
                <Switch
                  checked={settings.adaptiveStreaming}
                  onCheckedChange={(checked) => updateSetting('adaptiveStreaming', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offline-First Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Check cache before making network requests
                  </p>
                </div>
                <Switch
                  checked={settings.offlineFirst}
                  onCheckedChange={(checked) => updateSetting('offlineFirst', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Maximum Latency: {settings.maxLatency}ms</Label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={settings.maxLatency}
                  onChange={(e) => updateSetting('maxLatency', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Timeout for translation API requests
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Offline Cache
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Size:</span>
                <Badge variant="secondary">1000 translations max</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Expiry:</span>
                <Badge variant="secondary">7 days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-cleanup:</span>
                <Badge variant="default">Enabled</Badge>
              </div>
              
              <Separator />
              
              <Button variant="outline" className="w-full" asChild>
                <a href="/history">
                  View Translation History
                </a>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Device Handoff */}
        <TabsContent value="devices" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Handoff
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    Enable Device Handoff
                    <Badge variant="secondary">Coming Soon</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Seamlessly continue translations across devices
                  </p>
                </div>
                <Switch
                  checked={settings.deviceHandoffEnabled}
                  onCheckedChange={(checked) => updateSetting('deviceHandoffEnabled', checked)}
                  disabled
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync Translation History</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep history in sync across all devices
                  </p>
                </div>
                <Switch
                  checked={settings.syncTranslationHistory}
                  onCheckedChange={(checked) => updateSetting('syncTranslationHistory', checked)}
                  disabled={!settings.deviceHandoffEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync Favorites</Label>
                  <p className="text-sm text-muted-foreground">
                    Share favorited translations between devices
                  </p>
                </div>
                <Switch
                  checked={settings.syncFavorites}
                  onCheckedChange={(checked) => updateSetting('syncFavorites', checked)}
                  disabled={!settings.deviceHandoffEnabled}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Paired Devices</h3>
            
            <div className="space-y-3">
              {settings.pairedDevices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No devices paired yet</p>
                  <p className="text-xs mt-1">Enable device handoff to get started</p>
                </div>
              ) : (
                settings.pairedDevices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <Laptop className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{device}</span>
                    </div>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                ))
              )}
              
              <Button variant="outline" className="w-full" disabled={!settings.deviceHandoffEnabled}>
                <Smartphone className="h-4 w-4 mr-2" />
                Pair New Device
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                  Feature in Development
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Device handoff is coming soon! This will allow you to seamlessly continue translations 
                  between your phone, tablet, desktop, and wearable devices with secure end-to-end encryption.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Enterprise Features */}
        <TabsContent value="enterprise" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Enterprise Mode
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    Enable Enterprise Features
                    <Badge variant="secondary">Pro</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Unlock custom API endpoints and advanced controls
                  </p>
                </div>
                <Switch
                  checked={settings.enterpriseMode}
                  onCheckedChange={(checked) => updateSetting('enterpriseMode', checked)}
                />
              </div>

              {settings.enterpriseMode && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label>Custom API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your API key"
                      value={settings.apiKeyCustom}
                      onChange={(e) => updateSetting('apiKeyCustom', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use your own LibreTranslate API key for higher rate limits
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Custom API Endpoint</Label>
                    <Input
                      type="url"
                      placeholder="https://your-api.example.com"
                      value={settings.customEndpoint}
                      onChange={(e) => updateSetting('customEndpoint', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Point to your self-hosted LibreTranslate instance
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Feature Flags
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Beta Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable experimental features in development
                  </p>
                </div>
                <Switch
                  checked={settings.featureFlags.betaFeatures}
                  onCheckedChange={(checked) => updateFeatureFlag('betaFeatures', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Experimental UI</Label>
                  <p className="text-sm text-muted-foreground">
                    Try new interface designs before release
                  </p>
                </div>
                <Switch
                  checked={settings.featureFlags.experimentalUI}
                  onCheckedChange={(checked) => updateFeatureFlag('experimentalUI', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Advanced Statistics</Label>
                  <p className="text-sm text-muted-foreground">
                    Show detailed usage analytics and metrics
                  </p>
                </div>
                <Switch
                  checked={settings.featureFlags.advancedStats}
                  onCheckedChange={(checked) => updateFeatureFlag('advancedStats', checked)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Information</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">App Version:</span>
                <span className="font-mono">2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Version:</span>
                <span className="font-mono">v1.5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build:</span>
                <span className="font-mono">prod-{new Date().toISOString().split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant="default">Production</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
