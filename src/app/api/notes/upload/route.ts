import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateText } from "@/lib/ollama";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  const fileType = ALLOWED_TYPES[mimeType];

  if (fileType === "pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text?.trim() || "";
  }

  if (fileType === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() || "";
  }

  if (fileType === "txt") {
    return buffer.toString("utf-8").trim();
  }

  throw new Error("Unsupported file type.");
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim();
    const autoSummarize = formData.get("autoSummarize") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let content: string;
    try {
      content = await extractText(buffer, file.type);
    } catch {
      return NextResponse.json(
        { error: "Failed to extract text from the file. The file may be corrupted or empty." },
        { status: 422 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "No text could be extracted from this file. It may be image-based or empty." },
        { status: 422 }
      );
    }

    const noteTitle = title || file.name.replace(/\.[^.]+$/, "");

    let summary: string | null = null;

    if (autoSummarize) {
      try {
        // Truncate very long content to avoid token limits
        const truncated = content.length > 12000 ? content.slice(0, 12000) + "\n\n[Content truncated for summarization]" : content;
        summary = await generateText(
          "You are a study assistant. Summarize the following lecture notes or document into " +
            "concise, well-organized bullet points that capture every key concept. " +
            "Keep language clear and student-friendly.",
          `Please summarize this document:\n\n${truncated}`,
          { temperature: 0.4, maxOutputTokens: 800 }
        );
        if (!summary?.trim()) summary = null;
      } catch (err) {
        console.error("Auto-summarize failed (note will be saved without summary):", err);
      }
    }

    const note = await db.note.create({
      data: {
        title: noteTitle,
        content,
        summary,
        fileName: file.name,
        userId: session.user.id,
      },
      include: { subject: { select: { name: true, color: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to process uploaded file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
