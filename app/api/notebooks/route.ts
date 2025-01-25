import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db"; // Database connection
import { notebooks } from "@/lib/db/schema"; // Notebooks schema from Drizzle ORM
import { eq, and } from "drizzle-orm"; // Import the equality operator for queries
import { getAuth } from "@clerk/nextjs/server";
import { DrizzleNotebook } from "@/lib/db/schema";

export const runtime = 'edge';

// Save a new notebook
export async function POST(req: NextRequest) {
  try {
    const { userId: requestUserId, name, type } = await req.json();
    const { userId } = getAuth(req);

    // Verify authenticated user matches the requested user
    if (!userId || userId !== requestUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate the input fields
    if (!requestUserId || !name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert the new notebook into the database
    const newNotebook = await db.insert(notebooks).values({
      userId: requestUserId,
      name,
      type,
      date: new Date(),
      sources: 0,
    }).returning();

    return NextResponse.json({ success: true, notebook: newNotebook[0] });
  } catch (error) {
    console.error("Error saving notebook:", error);
    return NextResponse.json({ error: "Failed to save notebook" }, { status: 500 });
  }
}

// Fetch notebooks for a specific user or a single notebook by ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const id = searchParams.get("id");
    const { userId } = getAuth(req);

    // Ensure user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create response object with caching headers
    const response = (data: { 
      success: boolean, 
      notebook?: DrizzleNotebook, 
      notebooks?: DrizzleNotebook[], 
      error?: string 
    }) => {
      return new NextResponse(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
        },
      });
    };

    if (id) {
      // Convert ID string to number
      const notebookId = parseInt(id, 10);
      if (isNaN(notebookId)) {
        return NextResponse.json({ error: "Invalid notebook ID" }, { status: 400 });
      }

      // Fetch a single notebook by ID and verify ownership
      const notebook = await db.select()
        .from(notebooks)
        .where(and(
          eq(notebooks.id, notebookId),
          eq(notebooks.userId, userId)
        ))
        .limit(1);
      
      if (notebook.length === 0) {
        return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
      }

      return response({ success: true, notebook: notebook[0] });
    } else if (requestedUserId) {
      // Verify the requesting user matches the requested user ID
      if (requestedUserId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Query notebooks associated with the given userId
      const userNotebooks = await db.select()
        .from(notebooks)
        .where(eq(notebooks.userId, userId));
      return response({ success: true, notebooks: userNotebooks });
    } else {
      return NextResponse.json({ error: "Missing userId or id parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    return NextResponse.json({ error: "Failed to fetch notebooks" }, { status: 500 });
  }
}

// Delete a notebook
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const notebookId = searchParams.get("id");
    const { userId } = getAuth(req);

    // Ensure user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate the notebookId
    if (!notebookId) {
      return NextResponse.json({ error: "Missing notebook ID" }, { status: 400 });
    }

    // Verify ownership before deletion
    const notebook = await db.select()
      .from(notebooks)
      .where(and(
        eq(notebooks.id, Number(notebookId)),
        eq(notebooks.userId, userId)
      ))
      .limit(1);

    if (notebook.length === 0) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    // Delete the notebook
    await db.delete(notebooks)
      .where(and(
        eq(notebooks.id, Number(notebookId)),
        eq(notebooks.userId, userId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notebook:", error);
    return NextResponse.json({ error: "Failed to delete notebook" }, { status: 500 });
  }
}

// Update a notebook
export async function PUT(req: NextRequest) {
  try {
    const { id, name } = await req.json();
    const { userId } = getAuth(req);

    // Ensure user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate the input fields
    if (!id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership before update
    const notebook = await db.select()
      .from(notebooks)
      .where(and(
        eq(notebooks.id, id),
        eq(notebooks.userId, userId)
      ))
      .limit(1);

    if (notebook.length === 0) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    // Update the notebook
    const updatedNotebook = await db.update(notebooks)
      .set({ name })
      .where(and(
        eq(notebooks.id, id),
        eq(notebooks.userId, userId)
      ))
      .returning();

    return NextResponse.json({ success: true, notebook: updatedNotebook[0] });
  } catch (error) {
    console.error("Error updating notebook:", error);
    return NextResponse.json({ error: "Failed to update notebook" }, { status: 500 });
  }
}