"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive ? "bg-purple-100 text-purple-800" : "text-gray-600 hover:bg-purple-50 hover:text-purple-700",
        className,
      )}
    >
      {children}
    </Link>
  )
}
