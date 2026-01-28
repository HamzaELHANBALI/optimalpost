'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Zap,
  Repeat,
  Target,
  Sparkles,
  BarChart3,
  Mic,
  MonitorPlay,
  Lightbulb,
  FileText,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description:
      'Deep analysis of your viral content to extract hook patterns, retention mechanics, and emotional drivers.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Hook + Bridge Extraction',
    description:
      'Identify the exact hook that made your content go viral, plus the bridge sentence that keeps viewers watching.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Repeat,
    title: '5 Viral Frameworks',
    description:
      'Generate variations using proven frameworks: The Myth Buster, The Negative Case Study, The Step-by-Step, and more.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Target,
    title: 'Adjacent Topic Pivots',
    description:
      'Explore 5 strategic pivots to adjacent topics: Trap, Secret, Next Level, Origin Story, and Comparison.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Mic,
    title: 'Audio/Video Transcription',
    description:
      'Upload MP3, MP4, or MOV files and auto-transcribe to script. No manual typing required.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    badge: 'New',
  },
  {
    icon: MonitorPlay,
    title: 'Teleprompter Mode',
    description:
      'Practice your scripts with cue cards view or auto-scrolling teleprompter. Perfect your delivery.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    badge: 'New',
  },
  {
    icon: Lightbulb,
    title: 'AI Brainstorming',
    description:
      'Generate fresh video ideas based on your content history. Let AI find patterns in what works for your niche.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    badge: 'New',
  },
  {
    icon: FileText,
    title: 'Template Library',
    description:
      'Start from proven script templates organized by niche. Perfect for when you need a starting point.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: Globe,
    title: 'Multi-Platform Output',
    description:
      'Optimize for TikTok or Twitter/X with platform-specific hashtags, titles, and formatting.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Everything You Need to Scale Your Content
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            From analysis to execution—ProvenPost gives you the complete toolkit to
            replicate your viral success.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="h-full border-2 transition-all hover:border-primary/20 hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}>
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      {feature.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
