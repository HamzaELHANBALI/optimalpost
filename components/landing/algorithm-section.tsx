'use client';

import { motion } from 'framer-motion';
import { Brain, Layers, Sparkles, Target, Zap, GitBranch } from 'lucide-react';

const algorithmSteps = [
  {
    icon: Brain,
    title: 'Pattern Recognition',
    description: 'AI analyzes hook structure, retention triggers, and emotional drivers from your viral content.',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    icon: Layers,
    title: 'Viral Framework Matching',
    description: 'Maps your content to proven frameworks: The Myth Buster, The Negative Case Study, The Step-by-Step, and more.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Sparkles,
    title: 'Smart Variation Engine',
    description: 'Generates 10+ variations preserving the exact formula that made your original successful.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: GitBranch,
    title: 'Adjacent Topic Discovery',
    description: 'Finds related angles using Trap, Secret, Next Level, Origin, and Comparison pivot strategies.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
];

export function AlgorithmSection() {
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.08),transparent_40%)]" />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">No Black Box</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            How Our AI Actually Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Transparent, pattern-based analysis—not random generation. 
            See exactly how we extract your winning formula.
          </motion.p>
        </div>

        {/* Algorithm flow visualization */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {algorithmSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {index < algorithmSteps.length - 1 && (
                    <div className="absolute right-0 top-12 hidden h-0.5 w-6 translate-x-full bg-gradient-to-r from-border to-transparent lg:block" />
                  )}
                  
                  <div className="group h-full rounded-2xl border-2 border-transparent bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-lg">
                    {/* Step number */}
                    <div className="mb-4 text-xs font-bold text-muted-foreground/50">
                      STEP {index + 1}
                    </div>
                    
                    {/* Icon */}
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${step.bgColor} transition-transform group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    
                    {/* Content */}
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Result callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <div className="rounded-2xl border bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-6 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-primary" />
            <p className="text-lg font-medium text-foreground">
              The result? Scripts that feel like <span className="text-primary">your voice</span>, 
              following patterns <span className="text-primary">proven to work</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
