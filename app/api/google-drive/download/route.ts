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

    let downloadUrl: string;
    let params: Record<string, string>;

    // Handle Google Docs native formats - export as PDF (simpler and more reliable)
    if (mimeType?.startsWith("application/vnd.google-apps")) {
      // Export all Google Workspace docs as PDF
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
      params = {}; // Don't pass params separately for export endpoint
    } else {
      // For regular files, download with alt=media
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
      params = { alt: "media" };
    }

    // Use Pipedream proxy to download the file
    const proxyResponse = await pd.proxy.get({
      url: downloadUrl,
      externalUserId: user.id,
      accountId: accountId,
      params: params,
    });

    // Convert response to buffer - handle Pipedream SDK response formats
    let fileBuffer: Buffer;
    
    console.log("Pipedream response type:", typeof proxyResponse);
    console.log("Is null:", proxyResponse === null);
    console.log("Is Buffer:", Buffer.isBuffer(proxyResponse));
    console.log("Is ArrayBuffer:", proxyResponse instanceof ArrayBuffer);
    console.log("Is Uint8Array:", proxyResponse instanceof Uint8Array);
    
    // Check if response is wrapped by Pipedream SDK (for non-JSON responses)
    if (typeof proxyResponse === 'object' && proxyResponse !== null) {
      const wrappedResponse = proxyResponse as any;
      
      console.log("Object keys:", Object.keys(wrappedResponse));
      console.log("Has rawBody:", !!wrappedResponse.rawBody);
      console.log("Has error:", !!wrappedResponse.error);
      console.log("Has ok:", !!wrappedResponse.ok);
      console.log("Has data:", !!wrappedResponse.data);
      console.log("Has body:", !!wrappedResponse.body);
      
      // Try multiple possible locations for the response body
      const rawBody = wrappedResponse.rawBody || 
                      wrappedResponse.error?.rawBody || 
                      wrappedResponse.data?.rawBody ||
                      wrappedResponse.body ||
                      wrappedResponse.data;
      
      if (rawBody) {
        console.log("Found body at location, type:", typeof rawBody);
        if (typeof rawBody === 'string') {
          console.log("Body string length:", rawBody.length);
          fileBuffer = Buffer.from(rawBody, 'binary');
        } else if (Buffer.isBuffer(rawBody)) {
          fileBuffer = rawBody;
        } else if (rawBody instanceof ArrayBuffer) {
          fileBuffer = Buffer.from(rawBody);
        } else if (rawBody instanceof Uint8Array) {
          fileBuffer = Buffer.from(rawBody);
        } else {
          console.error("Unexpected rawBody type:", typeof rawBody);
          throw new Error("Unsupported rawBody format from Pipedream");
        }
      } else {
        // Log full response structure for debugging
        console.error("Full response structure:", JSON.stringify(wrappedResponse, null, 2).substring(0, 500));
        throw new Error("Could not extract file content from Pipedream response. Check server logs for details.");
      }
    } else if (Buffer.isBuffer(proxyResponse)) {
      // Already a buffer
      console.log("Direct Buffer response");
      fileBuffer = proxyResponse;
    } else if (proxyResponse instanceof ArrayBuffer) {
      // ArrayBuffer from binary response
      console.log("Direct ArrayBuffer response");
      fileBuffer = Buffer.from(proxyResponse);
    } else if (proxyResponse instanceof Uint8Array) {
      // Uint8Array
      console.log("Direct Uint8Array response");
      fileBuffer = Buffer.from(proxyResponse);
    } else if (typeof proxyResponse === "string") {
      // String response - treat as binary (latin1 encoding preserves bytes)
      console.log("Direct string response, length:", proxyResponse.length);
      fileBuffer = Buffer.from(proxyResponse, 'binary');
    } else {
      // Fallback
      console.error("Unexpected response type:", typeof proxyResponse);
      throw new Error("Unsupported response format from API");
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
