'use client';

import { motion } from 'framer-motion';
import { Brain, Zap, Repeat, Target, Sparkles, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description:
      'Deep analysis of your viral content to extract hook patterns, structure, retention mechanics, and emotional drivers.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Hook Extraction',
    description:
      'Identify the exact hook that made your content go viral, so you can replicate the pattern in future content.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Repeat,
    title: 'Same Topic Variations',
    description:
      'Generate 5 variations using different archetypes: Rant, Analyst, Storyteller, Contrarian, and Coach.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Target,
    title: 'Adjacent Topic Pivots',
    description:
      'Explore 5 strategic pivots to adjacent topics while preserving your winning structure: Trap, Secret, Next Level, Origin, Comparison.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Sparkles,
    title: 'Content Optimization',
    description:
      'Understand your niche, audience, topic angles, and emotional drivers to create more engaging content.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Insights',
    description:
      'Get actionable insights about what makes your content perform, backed by AI analysis of viral patterns.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
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
            ProvenPost analyzes your best-performing content and gives you the tools to create more of it.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-2 transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
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

