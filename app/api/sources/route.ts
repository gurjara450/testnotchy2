import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sources, notebooks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const notebookId = searchParams.get("notebookId");

    if (!notebookId) {
      return NextResponse.json(
        { error: "Notebook ID is required" },
        { status: 400 }
      );
    }

    const notebookSources = await db
      .select()
      .from(sources)
      .where(eq(sources.notebookId, parseInt(notebookId)));

    return NextResponse.json({ sources: notebookSources });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { notebookId, name, key, type } = body;

    if (!notebookId || !name || !key || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert the new source
    const [newSource] = await db
      .insert(sources)
      .values({
        notebookId,
        name,
        key,
        type,
      })
      .returning();

    // Update the sources count in the notebook
    await db
      .update(notebooks)
      .set({
        sources: sql`${notebooks.sources} + 1`,
      })
      .where(eq(notebooks.id, notebookId));

    return NextResponse.json({ source: newSource });
  } catch (error) {
    console.error("Error saving source:", error);
    return NextResponse.json(
      { error: "Failed to save source" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const notebookId = searchParams.get("notebookId");

    if (!id && !notebookId) {
      return NextResponse.json(
        { error: "Either source ID or notebook ID is required" },
        { status: 400 }
      );
    }

    if (id) {
      // Single source deletion logic
      const [source] = await db
        .select()
        .from(sources)
        .where(eq(sources.id, parseInt(id)));

      if (!source) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 }
        );
      }

      // Delete the source
      await db
        .delete(sources)
        .where(eq(sources.id, parseInt(id)));

      // Update the sources count in the notebook
      await db
        .update(notebooks)
        .set({
          sources: sql`${notebooks.sources} - 1`,
        })
        .where(eq(notebooks.id, source.notebookId));

      return NextResponse.json({ success: true });
    } else if (notebookId) {
      // Bulk deletion by notebookId
      const parsedNotebookId = parseInt(notebookId);
      if (isNaN(parsedNotebookId)) {
        return NextResponse.json(
          { error: "Invalid notebook ID" },
          { status: 400 }
        );
      }

      const notebookSources = await db
        .select()
        .from(sources)
        .where(eq(sources.notebookId, parsedNotebookId));

      if (notebookSources.length === 0) {
        return NextResponse.json({ success: true });
      }

      // Delete all sources for the notebook
      await db
        .delete(sources)
        .where(eq(sources.notebookId, parsedNotebookId));

      // Reset the sources count in the notebook to 0
      await db
        .update(notebooks)
        .set({
          sources: 0,
        })
        .where(eq(notebooks.id, parsedNotebookId));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting source(s):", error);
    return NextResponse.json(
      { error: "Failed to delete source(s)" },
      { status: 500 }
    );
  }
} 