import { NextResponse } from "next/server";
import { pd } from "@/lib/pipedream";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { accountId, fileId, fileName, mimeType } = await req.json();

    if (!accountId || !fileId || !fileName) {
      return NextResponse.json(
        { error: "accountId, fileId, and fileName are required" },
        { status: 400 }
      );
    }

    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    let params: Record<string, string> = { alt: "media" };

    // Handle Google Docs native formats - export them
    if (mimeType?.startsWith("application/vnd.google-apps")) {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export`;
      
      // Map Google's mime types to export formats
      const exportMimeTypes: Record<string, string> = {
        "application/vnd.google-apps.document": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.google-apps.spreadsheet": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.google-apps.presentation": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      };

      const exportMimeType = exportMimeTypes[mimeType];
      if (exportMimeType) {
        params.mimeType = exportMimeType;
      } else {
        // Default to plain text for other Google formats
        params.mimeType = "text/plain";
      }
    }

    // Use Pipedream proxy to download the file
    const proxyResponse = await pd.proxy.get({
      url: downloadUrl,
      externalUserId: user.id,
      accountId: accountId,
      params: params,
    });

    // Convert response to buffer
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(proxyResponse)) {
      fileBuffer = proxyResponse;
    } else if (typeof proxyResponse === "string") {
      fileBuffer = Buffer.from(proxyResponse);
    } else {
      fileBuffer = Buffer.from(JSON.stringify(proxyResponse));
    }

    // Return the file content as base64
    return NextResponse.json({
      success: true,
      fileName: fileName,
      content: fileBuffer.toString("base64"),
      mimeType: mimeType,
    });
  } catch (error: any) {
    console.error("Failed to download file:", error);
    return NextResponse.json(
      { error: "Failed to download file", details: error.message },
      { status: 500 }
    );
  }
}
