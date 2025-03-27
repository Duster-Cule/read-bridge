"use client"

// Cloudflare needs it, see: https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes
export const runtime = "nodejs"
export const dynamic = "force-static"
export const dynamicParams = false

export const revalidate = 60

import HomeContent from '@/src/app/home/page';

export default function Home() {
  return (
    <HomeContent />
  );
}
