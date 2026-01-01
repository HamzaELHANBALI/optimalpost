'use client';

import { motion } from 'framer-motion';
import { FileText, Sparkles, Repeat, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Paste Your Viral Script',
    description:
      'Copy and paste the script from your best-performing video. We support both voiceover scripts and text overlay content.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI Analyzes the Pattern',
    description:
      'Our AI extracts the hook, analyzes the structure, identifies retention mechanics, and understands your niche and audience.',
  },
  {
    number: '03',
    icon: Repeat,
    title: 'Get 10+ Variations',
    description:
      'Receive 5 same-topic variations using different archetypes and 5 adjacent-topic pivots that preserve your winning structure.',
  },
  {
    number: '04',
    icon: Rocket,
    title: 'Create More Viral Content',
    description:
      'Use the insights and variations to create new content that follows the same winning formula that made your original go viral.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 bg-muted/30">
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
            From viral script to content strategy in four simple steps.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Connecting line for desktop */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 top-16 hidden h-full w-0.5 -translate-x-1/2 bg-border md:block" />
                  )}

                  <div className="relative flex gap-6">
                    {/* Step number and icon */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                      {index < steps.length - 1 && (
                        <div className="mt-2 hidden h-8 w-0.5 bg-border md:block" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="mb-2 text-sm font-semibold text-primary">
                        {step.number}
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
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

