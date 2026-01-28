import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/favorites - Fetch user's saved scripts
export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const collection = searchParams.get("collection");

        const savedScripts = await prisma.savedScript.findMany({
            where: {
                userId: session.user.id,
                ...(collection && collection !== "all" ? { collection } : {}),
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ scripts: savedScripts });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return NextResponse.json(
            { error: "Failed to fetch favorites" },
            { status: 500 }
        );
    }
}

// POST /api/favorites - Save a script to favorites
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            sessionId,
            hookText,
            hookType,
            bridgeText,
            bodyText,
            framework,
            pivotType,
            hashtags,
            videoTitle,
            platform,
            collection,
        } = body;

        // Validate required fields
        if (!hookText || !bridgeText || !bodyText) {
            return NextResponse.json(
                { error: "Missing required fields: hookText, bridgeText, bodyText" },
                { status: 400 }
            );
        }

        const savedScript = await prisma.savedScript.create({
            data: {
                userId: session.user.id,
                sessionId: sessionId || null,
                hookText,
                hookType: hookType || "statement",
                bridgeText,
                bodyText,
                framework: framework || null,
                pivotType: pivotType || null,
                hashtags: hashtags || [],
                videoTitle: videoTitle || null,
                platform: platform || "tiktok",
                collection: collection || "default",
            },
        });

        return NextResponse.json({ script: savedScript }, { status: 201 });
    } catch (error) {
        console.error("Error saving favorite:", error);
        return NextResponse.json(
            { error: "Failed to save favorite" },
            { status: 500 }
        );
    }
}

// DELETE /api/favorites - Remove a script from favorites
export async function DELETE(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get("id");

    if (!scriptId) {
        return NextResponse.json({ error: "Script ID required" }, { status: 400 });
    }

    try {
        // Verify ownership
        const script = await prisma.savedScript.findFirst({
            where: { id: scriptId, userId: session.user.id },
        });

        if (!script) {
            return NextResponse.json({ error: "Script not found" }, { status: 404 });
        }

        await prisma.savedScript.delete({
            where: { id: scriptId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting favorite:", error);
        return NextResponse.json(
            { error: "Failed to delete favorite" },
            { status: 500 }
        );
    }
}
