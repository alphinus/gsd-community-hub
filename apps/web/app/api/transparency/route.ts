import { NextResponse } from "next/server";
import { transparencyConfig } from "@/lib/config/transparency-config";

/**
 * GET /api/transparency
 *
 * Public endpoint (no auth required). Returns transparency data:
 * multisig details, program info, repository, and token authority status.
 */
export async function GET() {
  return NextResponse.json({
    multisig: transparencyConfig.multisig,
    programs: transparencyConfig.programs,
    repository: transparencyConfig.repository,
    tokenInfo: transparencyConfig.tokenInfo,
  });
}
