'use client';

import { useState, useEffect } from 'react';
import { Repeat, Sparkles, History, Beaker, Loader2, AlertCircle, Zap, Brain, Heart, Target, Users, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ResultCard } from '@/components/result-card';
import { HistorySidebar } from '@/components/history-sidebar';
import { useAssetLibrary } from '@/hooks/use-asset-library';
import { AnalysisResult } from '@/lib/types';
import { AuthButton } from '@/components/auth/auth-button';
import { MigrationPrompt } from '@/components/auth/migration-prompt';

const loadingMessages = [
  'Analyzing hook patterns...',
  'Breaking down structure...',
  'Engineering attention...',
  'Generating hook variations...',
  'Formatting for teleprompter...',
];

export default function Home() {
  const [content, setContent] = useState('');
  const [inputType, setInputType] = useState<'voiceover' | 'text-overlay'>('voiceover');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { addSession, currentSession, clearCurrentSession } = useAssetLibrary();

  // Handle auth codes that might land on the home page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const token_hash = params.get('token_hash');
      const token = params.get('token');
      const type = params.get('type');

      // If we have auth-related parameters, redirect to callback
      if (code || token_hash || (token && type)) {
        const callbackUrl = new URL('/auth/callback', window.location.origin);
        params.forEach((value, key) => {
          callbackUrl.searchParams.set(key, value);
        });
        window.location.href = callbackUrl.toString();
        return;
      }
    }
  }, []);

  // Load current session data when it changes
  useEffect(() => {
    if (currentSession) {
      setContent(currentSession.originalInput);
      setInputType(currentSession.inputType);
      setResult({
        analysis: currentSession.analysis,
        same_topic_variations: currentSession.sameTopicVariations,
        adjacent_topic_variations: currentSession.adjacentTopicVariations,
      });
    }
  }, [currentSession]);

  // Cycle loading messages
  useEffect(() => {
    if (!isLoading) return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[index]);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleAnalyze = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, inputType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze content');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      // Save to history
      await addSession({
        originalInput: content,
        inputType,
        analysis: data.analysis,
        sameTopicVariations: data.same_topic_variations,
        adjacentTopicVariations: data.adjacent_topic_variations,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setContent('');
    setResult(null);
    setError(null);
    clearCurrentSession();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Beaker className="h-7 w-7 text-primary" />
              <Sparkles className="h-3 w-3 text-purple-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              OptimalPost
            </h1>
            <span className="text-xs text-muted-foreground hidden sm:inline-block px-2 py-0.5 rounded-full bg-muted">
              Content Lab
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Migration Prompt */}
        <MigrationPrompt />

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Analyze Viral Script
                    <Zap className="h-5 w-5 text-yellow-500" />
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Paste your best-performing script and let AI extract the winning formula
                  </CardDescription>
                </div>
                {result && (
                  <Button variant="ghost" size="sm" onClick={handleNewSession}>
                    New Analysis
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'voiceover' | 'text-overlay')}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="voiceover">Voiceover Script</TabsTrigger>
                  <TabsTrigger value="text-overlay">Text Overlay</TabsTrigger>
                </TabsList>
              </Tabs>

              <Textarea
                placeholder="Paste the script from your viral video here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[180px] text-base resize-none"
                disabled={isLoading}
              />

              <Button
                size="lg"
                className="w-full text-base font-semibold h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                onClick={handleAnalyze}
                disabled={isLoading || !content.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {loadingMessage}
                  </span>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Analyze & Generate Variations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Analysis Breakdown - Updated for new schema */}
              <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-yellow-500" />
                    Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Hook */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">The Hook</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {result.analysis.hook}
                      </p>
                    </div>

                    {/* Structure */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Structure</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {result.analysis.structure}
                      </p>
                    </div>

                    {/* Retention Mechanics */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Retention Mechanics</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {result.analysis.retention_mechanics}
                      </p>
                    </div>

                    {/* Niche & Audience */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-500" />
                        <span className="text-sm font-medium">Niche & Audience</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {result.analysis.niche_and_audience}
                      </p>
                    </div>

                    {/* Topic Angle */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Topic & Angle</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {result.analysis.topic_angle}
                      </p>
                    </div>

                    {/* Emotional Driver */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Emotional Driver</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {result.analysis.emotional_driver}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator className="my-6" />

              {/* Two Column Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Same Topic Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Repeat className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Same Topic</h3>
                      <p className="text-xs text-muted-foreground">5 archetypes: Rant, Analyst, Storyteller, Contrarian, Coach</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.same_topic_variations.map((item, index) => (
                      <ResultCard
                        key={index}
                        hooks={item.hooks}
                        content={item.script_content}
                        angleType={item.angle_type}
                        label={item.retention_tactic}
                        variant="double-down"
                        index={index}
                      />
                    ))}
                  </div>
                </div>

                {/* Adjacent Topics Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Adjacent Topics</h3>
                      <p className="text-xs text-muted-foreground">5 pivots: Trap, Secret, Next Level, Origin, Comparison</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.adjacent_topic_variations.map((item, index) => (
                      <ResultCard
                        key={index}
                        hooks={item.hooks}
                        content={item.script_content}
                        pivotType={item.pivot_type}
                        label={item.pivot_topic}
                        sublabel={item.structure_preserved}
                        variant="experiment"
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* History Sidebar */}
      <HistorySidebar open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
