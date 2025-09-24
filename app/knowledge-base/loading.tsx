import { PlatformLayout } from "@/components/layout/platform-layout"

export default function KnowledgeBaseLoading() {
  return (
    <PlatformLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#7073fc] to-[#9c7bfc]">
        <div className="px-8 py-16 text-center">
          <div className="h-10 bg-white/20 rounded-lg w-96 mx-auto mb-8 animate-pulse" />
          <div className="max-w-2xl mx-auto">
            <div className="h-14 bg-white/20 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="px-8 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-xl h-32 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  )
}
