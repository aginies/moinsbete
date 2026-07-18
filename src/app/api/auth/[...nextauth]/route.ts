import { NextRequest, NextResponse } from 'next/server'
import { handlers } from "@/lib/auth"

export const GET = (request: NextRequest) => handlers.GET(request)
export const POST = (request: NextRequest) => handlers.POST(request)
