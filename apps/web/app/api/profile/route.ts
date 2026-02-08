import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { computeProfileHash } from "@gsd/utils";

/**
 * Validate a URL string starts with https://
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate profile input fields.
 * Returns an error message string if invalid, null if valid.
 */
function validateProfileInput(body: Record<string, unknown>): string | null {
  const { displayName, bio, githubUrl, twitterUrl, websiteUrl } = body;

  if (typeof displayName === "string") {
    if (displayName.length < 3 || displayName.length > 50) {
      return "displayName must be between 3 and 50 characters";
    }
  }

  if (typeof bio === "string") {
    if (bio.length < 1 || bio.length > 500) {
      return "bio must be between 1 and 500 characters";
    }
  }

  if (githubUrl !== undefined && githubUrl !== null && githubUrl !== "") {
    if (typeof githubUrl !== "string" || !isValidUrl(githubUrl)) {
      return "githubUrl must be a valid https:// URL";
    }
  }

  if (twitterUrl !== undefined && twitterUrl !== null && twitterUrl !== "") {
    if (typeof twitterUrl !== "string" || !isValidUrl(twitterUrl)) {
      return "twitterUrl must be a valid https:// URL";
    }
  }

  if (websiteUrl !== undefined && websiteUrl !== null && websiteUrl !== "") {
    if (typeof websiteUrl !== "string" || !isValidUrl(websiteUrl)) {
      return "websiteUrl must be a valid https:// URL";
    }
  }

  return null;
}

/**
 * POST /api/profile - Create a new developer profile
 *
 * Requires authentication. Creates the off-chain profile in PostgreSQL.
 * The on-chain PDA registration happens client-side (wallet signs the transaction).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.publicKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const walletAddress = session.publicKey;

    // Check if profile already exists
    const existing = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existing?.displayName) {
      return NextResponse.json(
        { error: "Profile already exists for this wallet" },
        { status: 409 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { displayName, bio, githubUrl, twitterUrl, websiteUrl } = body;

    // Validate required fields
    if (!displayName || typeof displayName !== "string") {
      return NextResponse.json(
        { error: "displayName is required" },
        { status: 400 }
      );
    }

    if (!bio || typeof bio !== "string") {
      return NextResponse.json(
        { error: "bio is required" },
        { status: 400 }
      );
    }

    const validationError = validateProfileInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Compute profile hash for on-chain verification
    const profileData = {
      displayName: displayName as string,
      bio: bio as string,
      ...(githubUrl ? { githubUrl: githubUrl as string } : {}),
      ...(twitterUrl ? { twitterUrl: twitterUrl as string } : {}),
      ...(websiteUrl ? { websiteUrl: websiteUrl as string } : {}),
    };
    const hashBytes = await computeProfileHash(profileData);
    const profileHash = Buffer.from(hashBytes).toString("hex");

    // Upsert: the User record may already exist from auth (walletAddress only),
    // so we update it with profile data
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        displayName: displayName as string,
        bio: bio as string,
        githubUrl: (githubUrl as string) || null,
        twitterUrl: (twitterUrl as string) || null,
        websiteUrl: (websiteUrl as string) || null,
        profileHash,
      },
      create: {
        walletAddress,
        displayName: displayName as string,
        bio: bio as string,
        githubUrl: (githubUrl as string) || null,
        twitterUrl: (twitterUrl as string) || null,
        websiteUrl: (websiteUrl as string) || null,
        profileHash,
      },
      select: {
        walletAddress: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        githubUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        profileHash: true,
        onChainPda: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile - Update an existing developer profile
 *
 * Requires authentication. Updates the off-chain profile in PostgreSQL.
 * The client will also send an update_profile_hash transaction on-chain after success.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.publicKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const walletAddress = session.publicKey;

    // Check user exists
    const existing = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validationError = validateProfileInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Build update data from provided fields
    const updateData: Record<string, string | null> = {};

    if (body.displayName !== undefined) {
      updateData.displayName = body.displayName as string;
    }
    if (body.bio !== undefined) {
      updateData.bio = body.bio as string;
    }
    if (body.githubUrl !== undefined) {
      updateData.githubUrl = (body.githubUrl as string) || null;
    }
    if (body.twitterUrl !== undefined) {
      updateData.twitterUrl = (body.twitterUrl as string) || null;
    }
    if (body.websiteUrl !== undefined) {
      updateData.websiteUrl = (body.websiteUrl as string) || null;
    }
    if (body.onChainPda !== undefined) {
      updateData.onChainPda = body.onChainPda as string;
    }

    // Compute new profile hash from the merged profile data
    const mergedProfile = {
      displayName: (updateData.displayName ?? existing.displayName) as string,
      bio: (updateData.bio ?? existing.bio) as string,
      ...(updateData.githubUrl !== undefined
        ? updateData.githubUrl
          ? { githubUrl: updateData.githubUrl }
          : {}
        : existing.githubUrl
          ? { githubUrl: existing.githubUrl }
          : {}),
      ...(updateData.twitterUrl !== undefined
        ? updateData.twitterUrl
          ? { twitterUrl: updateData.twitterUrl }
          : {}
        : existing.twitterUrl
          ? { twitterUrl: existing.twitterUrl }
          : {}),
      ...(updateData.websiteUrl !== undefined
        ? updateData.websiteUrl
          ? { websiteUrl: updateData.websiteUrl }
          : {}
        : existing.websiteUrl
          ? { websiteUrl: existing.websiteUrl }
          : {}),
    };

    const hashBytes = await computeProfileHash(mergedProfile);
    updateData.profileHash = Buffer.from(hashBytes).toString("hex");

    const user = await prisma.user.update({
      where: { walletAddress },
      data: updateData,
      select: {
        walletAddress: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        githubUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        profileHash: true,
        onChainPda: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
