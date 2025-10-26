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

    const { accountId, folderId, pageSize = 20 } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    // Build query to get files
    // If folderId is provided, get files in that folder
    // Otherwise get files in root folder
    const query = folderId
      ? `'${folderId}' in parents`
      : "'root' in parents";

    // Use Pipedream proxy to make authenticated Google Drive API call
    const proxyResponse = await pd.proxy.get({
      url: "https://www.googleapis.com/drive/v3/files",
      externalUserId: user.id,
      accountId: accountId,
      params: {
        q: `${query} and trashed=false`,
        pageSize: pageSize.toString(),
        fields: "files(id,name,mimeType,parents,webViewLink,iconLink,modifiedTime,size),nextPageToken",
        orderBy: "folder,name",
      },
    });

    const data = proxyResponse as any;
    
    // Separate folders and files
    const files = data?.files || [];
    const folders = files.filter((f: any) => f.mimeType === "application/vnd.google-apps.folder");
    const documents = files.filter((f: any) => f.mimeType !== "application/vnd.google-apps.folder");

    return NextResponse.json({
      files: documents,
      folders: folders,
      nextPageToken: data?.nextPageToken,
    });
  } catch (error: any) {
    console.error("Failed to fetch files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files", details: error.message },
      { status: 500 }
    );
  }
}
