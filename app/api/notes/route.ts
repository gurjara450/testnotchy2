import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes, DrizzleNote } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Create a new note
export async function POST(req: Request) {
  try {
    const { notebookId, content, pinned = false, background = "plain", font = "default" } = await req.json();

    if (!notebookId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newNote = await db.insert(notes).values({
      notebookId,
      content,
      pinned,
      background,
      font,
    }).returning();

    return NextResponse.json({ success: true, note: newNote[0] });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

// Get notes for a notebook
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const notebookId = searchParams.get("notebookId");

    if (!notebookId) {
      return NextResponse.json({ error: "Missing notebookId" }, { status: 400 });
    }

    const notebookNotes = await db.select()
      .from(notes)
      .where(eq(notes.notebookId, parseInt(notebookId)))
      .orderBy(notes.createdAt);

    return NextResponse.json({ success: true, notes: notebookNotes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// Update a note
export async function PUT(req: Request) {
  try {
    const { id, content, pinned, background, font, lineHeight, letterSpacing, textColor, images } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing note id" }, { status: 400 });
    }

    const updates: Partial<DrizzleNote> = {
      updatedAt: new Date(),
    };

    // Only include fields that are provided in the request
    if (content !== undefined) updates.content = content;
    if (pinned !== undefined) updates.pinned = pinned;
    if (background !== undefined) updates.background = background;
    if (font !== undefined) updates.font = font;
    if (lineHeight !== undefined) updates.lineHeight = lineHeight;
    if (letterSpacing !== undefined) updates.letterSpacing = letterSpacing;
    if (textColor !== undefined) updates.textColor = textColor;
    if (images !== undefined) updates.images = images;

    const updatedNote = await db.update(notes)
      .set(updates)
      .where(eq(notes.id, id))
      .returning();

    return NextResponse.json({ success: true, note: updatedNote[0] });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// Delete a note
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const notebookId = searchParams.get("notebookId");

    if (!id && !notebookId) {
      return NextResponse.json(
        { error: "Either note ID or notebook ID is required" },
        { status: 400 }
      );
    }

    if (id) {
      // Single note deletion
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { error: "Invalid note ID" },
          { status: 400 }
        );
      }

      await db.delete(notes).where(eq(notes.id, parsedId));
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

      // Delete all notes for the notebook
      await db
        .delete(notes)
        .where(eq(notes.notebookId, parsedNotebookId));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting note(s):", error);
    return NextResponse.json(
      { error: "Failed to delete note(s)" },
      { status: 500 }
    );
  }
} 