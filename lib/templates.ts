// lib/templates.ts
// Curated starter scripts for new users to get started quickly

export interface StarterTemplate {
    id: string;
    niche: 'finance' | 'health' | 'tech' | 'career' | 'lifestyle';
    nicheLabel: string;
    title: string;
    script: string;
    framework: string;
    preview: string; // Short preview for card display
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
    // 💰 Personal Finance
    {
        id: 'finance-myth',
        niche: 'finance',
        nicheLabel: 'Personal Finance',
        title: 'The Savings Myth',
        framework: 'The Myth Buster',
        preview: 'Challenges the "save 50% of income" advice',
        script: `Everyone says you need to save 50% of your income to build wealth. That's completely wrong. The real wealthy don't focus on saving—they focus on earning more. Here's what the top 1% actually do differently. They invest in skills that increase their income potential. They build assets that generate passive revenue. And they use leverage wisely instead of hoarding cash. Saving is defensive. Earning is offensive. The game is won on offense.`,
    },
    {
        id: 'finance-story',
        niche: 'finance',
        nicheLabel: 'Personal Finance',
        title: 'The $10K Credit Card Mistake',
        framework: 'The Negative Case Study',
        preview: 'Personal story of debt and recovery',
        script: `I was 22 with $10,000 in credit card debt. And it was entirely my fault. I thought minimum payments were enough. I ignored the 24% interest eating my money. I kept swiping because I "deserved nice things." Here's what finally broke the cycle. I calculated how much interest I was paying monthly. The number was $200. Going nowhere. That wake-up call changed everything.`,
    },

    // 🏋️ Health & Fitness
    {
        id: 'health-comparison',
        niche: 'health',
        nicheLabel: 'Health & Fitness',
        title: 'Morning vs Night Workouts',
        framework: 'The X vs Y',
        preview: 'Compares workout timing for results',
        script: `Morning workouts build discipline. Evening workouts build muscle. Here's the difference most people don't understand. In the morning, your cortisol is naturally high. This helps with fat burning but limits muscle growth. In the evening, your testosterone peaks. This is when your body is primed to build. So if you're trying to lose weight—morning. If you're trying to gain muscle—evening. Match your training to your goal.`,
    },
    {
        id: 'health-myth',
        niche: 'health',
        nicheLabel: 'Health & Fitness',
        title: 'You Don\'t Need 10K Steps',
        framework: 'The Myth Buster',
        preview: 'Debunks the 10,000 steps rule',
        script: `10,000 steps a day is the biggest fitness lie ever told. The number was invented by a Japanese pedometer company in 1965. It was marketing, not science. Research shows 7,500 steps gives you 90% of the health benefits. Anything beyond 10,000 has almost zero additional impact. Stop chasing an arbitrary number. Focus on consistent movement instead.`,
    },

    // 💻 Tech & Productivity
    {
        id: 'tech-secret',
        niche: 'tech',
        nicheLabel: 'Tech & Productivity',
        title: 'The Hidden ChatGPT Feature',
        framework: 'The Industry Secret',
        preview: 'Reveals advanced AI prompting technique',
        script: `99% of ChatGPT users don't know this feature exists. It's called "system prompts." Before you ask anything, you can tell ChatGPT HOW to respond. Watch this. Instead of asking "write me an email," say: "You are a professional copywriter with 10 years experience. Your tone is confident but friendly. Now write me an email." The response quality jumps 10x. The AI becomes whatever you tell it to become.`,
    },
    {
        id: 'tech-comparison',
        niche: 'tech',
        nicheLabel: 'Tech & Productivity',
        title: 'To-Do Lists Are Broken',
        framework: 'The X vs Y',
        preview: 'Time blocking vs traditional to-do lists',
        script: `Stop using to-do lists. They're destroying your productivity. Here's why. A list has no time constraint. You add 20 items and feel accomplished before doing anything. Then you cherry-pick easy tasks and leave the hard ones for "later." Time blocking fixes this. Every task gets a specific time slot. If it doesn't fit in your calendar, it doesn't happen. Constraints create action. Lists create illusion.`,
    },

    // 📈 Career & Business
    {
        id: 'career-story',
        niche: 'career',
        nicheLabel: 'Career & Business',
        title: 'I Got Fired on Purpose',
        framework: 'The Negative Case Study',
        preview: 'Turning job loss into opportunity',
        script: `I got fired from my dream job. And it was the best thing that happened to me. Here's what I learned. I was comfortable. Too comfortable. I stopped growing because I had no reason to. Getting fired forced me to rebuild from scratch. I learned skills I'd been avoiding. I built income streams I'd been too lazy to pursue. Sometimes you need to lose everything to find what you're capable of.`,
    },
    {
        id: 'career-myth',
        niche: 'career',
        nicheLabel: 'Career & Business',
        title: 'Work-Life Balance Doesn\'t Exist',
        framework: 'The Myth Buster',
        preview: 'Reframing the balance conversation',
        script: `Work-life balance is a lie sold by people who've never built anything. The truth is messier. When you're building something meaningful, work and life blend together. You can't compartmentalize passion. What you need isn't balance—it's integration. Design a life where work energizes you. Where rest is strategic, not escape. Balance is for accountants. Integration is for builders.`,
    },

    // ✨ Lifestyle & Personal Growth
    {
        id: 'lifestyle-story',
        niche: 'lifestyle',
        nicheLabel: 'Lifestyle',
        title: 'I Quit Social Media for 30 Days',
        framework: 'The Negative Case Study',
        preview: 'Digital detox transformation story',
        script: `I deleted every social media app for 30 days. Here's what happened. Week 1 was brutal. I reached for my phone 100 times a day. The phantom notifications were real. Week 2, something shifted. I started reading books again. I had conversations that lasted hours. Week 3, I felt calm in a way I hadn't in years. Week 4, I didn't want to go back. The experiment became a lifestyle.`,
    },
    {
        id: 'lifestyle-comparison',
        niche: 'lifestyle',
        nicheLabel: 'Lifestyle',
        title: 'Morning Routines Are Overrated',
        framework: 'The X vs Y',
        preview: 'Why evening routines matter more',
        script: `Everyone focuses on morning routines. But your evening routine is 10x more important. Here's why. A bad evening—scrolling, junk food, late nights—ruins your morning before it starts. A good evening—preparation, wind-down, early sleep—sets tomorrow up for success. Your morning is decided the night before. Win the evening. The morning takes care of itself.`,
    },
];

export const NICHE_OPTIONS = [
    { value: 'all', label: 'All Categories' },
    { value: 'finance', label: '💰 Personal Finance' },
    { value: 'health', label: '🏋️ Health & Fitness' },
    { value: 'tech', label: '💻 Tech & Productivity' },
    { value: 'career', label: '📈 Career & Business' },
    { value: 'lifestyle', label: '✨ Lifestyle' },
] as const;

export function getTemplatesByNiche(niche: string): StarterTemplate[] {
    if (niche === 'all') return STARTER_TEMPLATES;
    return STARTER_TEMPLATES.filter(t => t.niche === niche);
}
