import type React from "react"
export default function DebugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="debug-layout">{children}</div>
}
