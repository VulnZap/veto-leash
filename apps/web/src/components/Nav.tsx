import { useState } from 'react'
import { IconMenu2, IconX } from '@tabler/icons-react'

export function Nav() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo - icon only */}
        <a href="/" className="block">
          <img src="/veto-darkmode-icon.png" alt="veto" className="h-6 w-auto" />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <a 
            href="https://github.com/VulnZap/veto/tree/master/docs" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <a
            href="https://github.com/VulnZap/veto"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="#waitlist"
            className="btn-primary inline-flex items-center h-8 px-4 text-xs font-medium text-white rounded"
          >
            Join Waitlist
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-1.5 -mr-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <IconX className="w-5 h-5" /> : <IconMenu2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 space-y-3">
            <a 
              href="https://github.com/VulnZap/veto/tree/master/docs" 
              className="block text-sm text-muted-foreground hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
            <a
              href="https://github.com/VulnZap/veto"
              className="block text-sm text-muted-foreground hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="#waitlist"
              className="block btn-primary inline-flex items-center justify-center h-10 px-4 text-sm font-medium text-white rounded"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
