import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET - List sessions for logged-in user
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const sessions = await prisma.analysisSession.findMany({
            where: { userId: session.user.id },
            orderBy: { timestamp: "desc" },
        });

        // Convert BigInt to string for JSON serialization
        const serializedSessions = sessions.map(s => ({
            ...s,
            timestamp: s.timestamp.toString(),
        }));

        return NextResponse.json(serializedSessions);
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return NextResponse.json(
            { error: "Failed to fetch sessions" },
            { status: 500 }
        );
    }
}

// POST - Create session for logged-in user
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newSession = await prisma.analysisSession.create({
            data: {
                userId: session.user.id,
                timestamp: BigInt(Date.now()),
                originalInput: body.originalInput,
                inputType: body.inputType,
                analysis: body.analysis,
                sameTopicVariations: body.sameTopicVariations,
                adjacentTopicVariations: body.adjacentTopicVariations,
            },
        });

        // Convert BigInt to string for JSON serialization
        return NextResponse.json({
            ...newSession,
            timestamp: newSession.timestamp.toString(),
        });
    } catch (error) {
        console.error("Failed to create session:", error);
        return NextResponse.json(
            { error: "Failed to create session" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a session by ID (from query param)
export async function DELETE(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    try {
        // Verify ownership before delete
        const existingSession = await prisma.analysisSession.findUnique({
            where: { id },
        });

        if (!existingSession || existingSession.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.analysisSession.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete session:", error);
        return NextResponse.json(
            { error: "Failed to delete session" },
            { status: 500 }
        );
    }
}
