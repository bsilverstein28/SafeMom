import { NavLink } from "@/components/nav-link"
import { History } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function Header() {
  return (
    <header className="w-full border-b border-purple-100 bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <Image src="/images/safemom-logo.png" alt="SafeMom Logo" width={150} height={50} className="h-auto" />
          </Link>
          <div className="flex items-center space-x-4 ml-2">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/saved" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              Saved Searches
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  )
}
