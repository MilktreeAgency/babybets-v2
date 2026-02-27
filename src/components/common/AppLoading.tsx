export function AppLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#fffbf7]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#FF6B9D]/20 border-t-[#FF6B9D] rounded-full animate-spin"></div>
        <p className="text-sm text-[#2D251E]/60 font-medium">Loading...</p>
      </div>
    </div>
  )
}
