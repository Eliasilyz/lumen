import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { SignInButton, SignOutButton, Show, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });

  const navItems = [
    { label: "Hari Ini", href: "/" },
    { label: "Doa", href: "/prayers" },
    { label: "Kalender", href: "/calendar" },
    { label: "Dinding Harapan", href: "/wall" },
    { label: "Donasi", href: "/donate" },
  ];

  const authenticatedNavItems = [
    ...navItems,
    { label: "Tersimpan", href: "/bookmarks" },
  ];

  const activeNavItems = user ? authenticatedNavItems : navItems;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src={`${basePath}/logo.svg`} alt="Lumen" className="h-8 w-8 text-primary" />
              <span className="font-serif text-xl font-medium tracking-tight hidden sm:inline-block">Lumen</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {activeNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    location === item.href || (item.href !== "/" && location.startsWith(item.href))
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <div className="hidden sm:flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">Masuk</Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button size="sm">Daftar</Button>
                </SignInButton>
              </div>
            </Show>

            <Show when="signed-in">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{me?.user?.displayName || user?.firstName || "Pengguna"}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full">Profil & Pengaturan</Link>
                  </DropdownMenuItem>
                  {me?.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer w-full text-primary">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <SignOutButton>
                      <button className="w-full text-left cursor-pointer">Keluar</button>
                    </SignOutButton>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Show>

            {/* Mobile Nav */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {activeNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-lg font-medium ${
                        location === item.href || (item.href !== "/" && location.startsWith(item.href))
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Show when="signed-out">
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                      <SignInButton mode="modal">
                        <Button variant="outline" className="w-full justify-start">Masuk</Button>
                      </SignInButton>
                      <SignInButton mode="modal">
                        <Button className="w-full justify-start">Daftar</Button>
                      </SignInButton>
                    </div>
                  </Show>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
