import { Suspense } from "react"
import Image from "next/image"
import CryptoDashboard from "@/components/crypto-dashboard"
import LoadingDashboard from "@/components/loading-dashboard"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/images/hindustan-logo.png"
            alt="HindusthanCoin Logo"
            width={48}
            height={48}
            className="rounded-md"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Hindustan<span className="text-purple-500">Coin</span>
          </h1>
        </div>
        <Suspense fallback={<LoadingDashboard />}>
          <CryptoDashboard />
        </Suspense>
      </div>
    </main>
  )
}
