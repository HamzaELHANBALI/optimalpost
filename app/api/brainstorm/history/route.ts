import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET - Fetch brainstorm history
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const brainstormSessions = await prisma.brainstormSession.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        const total = await prisma.brainstormSession.count({
            where: { userId: session.user.id },
        });

        return NextResponse.json({
            sessions: brainstormSessions.map(s => ({
                id: s.id,
                ideas: s.ideas,
                sessionIds: s.sessionIds,
                ideaCount: s.ideaCount,
                createdAt: s.createdAt.toISOString(),
            })),
            total,
            hasMore: offset + limit < total,
        });
    } catch (error) {
        console.error('Brainstorm history error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch brainstorm history' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a brainstorm session
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        // Verify ownership and delete
        const deleted = await prisma.brainstormSession.deleteMany({
            where: {
                id: sessionId,
                userId: session.user.id,
            },
        });

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete brainstorm session error:', error);
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
