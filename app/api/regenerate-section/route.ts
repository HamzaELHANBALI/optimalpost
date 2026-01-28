import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/regenerate-section - Regenerate a specific section of a script
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { section, currentText, context } = body;

        if (!section || !currentText) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        let prompt = "";

        if (section === "hook") {
            prompt = `You are an expert viral content creator. Rewrite this hook to be more engaging and attention-grabbing while keeping the same core message.

Current hook: "${currentText}"

Context:
- Bridge: ${context.bridge}
- Framework: ${context.framework || "General"}

Rules:
- Keep it punchy and scroll-stopping
- Maintain the same topic/angle
- Make it more emotionally compelling
- Return ONLY the new hook text, nothing else`;
        } else if (section === "bridge") {
            prompt = `You are an expert viral content creator. Rewrite this bridge sentence to create a smoother transition from the hook to the body.

Current bridge: "${currentText}"

Context:
- Hook: ${context.hook}
- Framework: ${context.framework || "General"}

Rules:
- Keep it concise (1-2 sentences max)
- Create curiosity or set up the payoff
- Make viewers want to keep watching
- Return ONLY the new bridge text, nothing else`;
        } else if (section === "body") {
            prompt = `You are an expert viral content creator. Improve this script body to be more engaging while maintaining the core message.

Current body: "${currentText}"

Context:
- Hook: ${context.hook}
- Framework: ${context.framework || "General"}

Rules:
- Keep similar length and structure
- Make each segment punchy and valuable
- Improve clarity and flow
- Maintain the teaching/story style
- Return ONLY the new body text with segments separated by double newlines`;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a viral content expert. Return only the requested text, no explanations." },
                { role: "user", content: prompt },
            ],
            temperature: 0.8,
            max_tokens: 500,
        });

        const regeneratedText = completion.choices[0]?.message?.content?.trim();

        if (!regeneratedText) {
            throw new Error("No content generated");
        }

        return NextResponse.json({ text: regeneratedText });
    } catch (error) {
        console.error("Error regenerating section:", error);
        return NextResponse.json(
            { error: "Failed to regenerate section" },
            { status: 500 }
        );
    }
}
