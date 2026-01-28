'use client';

import { motion } from 'framer-motion';
import { FileText, Sparkles, Repeat, Rocket, Brain, Layers } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Paste Your Viral Script',
    description:
      'Copy and paste the script from your best-performing video, or upload audio/video and we\'ll transcribe it automatically.',
    hint: null,
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Analyzes the Pattern',
    description:
      'Our AI extracts the hook, analyzes the structure, and identifies retention mechanics.',
    hint: 'Detects hook type (question, statement, story, statistic), emotional triggers, and content classification.',
  },
  {
    number: '03',
    icon: Layers,
    title: 'Framework Matching',
    description:
      'Your content is matched against proven viral frameworks to maximize variation quality.',
    hint: 'Maps to frameworks like The Myth Buster, The Negative Case Study, The Step-by-Step, and 5 pivot strategies.',
  },
  {
    number: '04',
    icon: Repeat,
    title: 'Get 10+ Variations',
    description:
      'Receive 5 same-topic variations + 5 adjacent-topic pivots, each with 3 hook options and bridges.',
    hint: 'Every variation preserves your winning structure while exploring new angles.',
  },
  {
    number: '05',
    icon: Rocket,
    title: 'Create More Viral Content',
    description:
      'Use the teleprompter to practice, export your scripts, and start creating content that follows your proven formula.',
    hint: null,
  },
];

export function HowItWorks() {
  return (
    <section id="algorithm" className="py-24 sm:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            From viral script to content strategy in five intelligent steps.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Connecting line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 top-16 h-full w-0.5 bg-gradient-to-b from-primary/50 to-border" />
                  )}

                  <div className="relative flex gap-6">
                    {/* Step number and icon */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="mb-2 text-sm font-semibold text-primary">
                        STEP {step.number}
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                      {/* Algorithm hint */}
                      {step.hint && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Under the hood:</span>{' '}
                            {step.hint}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
