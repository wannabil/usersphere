import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">User Management</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/users">Users</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

