"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { BrandLockup } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <BrandLockup compact />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-muted-foreground transition hover:text-foreground",
                pathname === item.href && "text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button asChild>
            <Link href="/register">Start tracking</Link>
          </Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="border border-border/70 bg-background/30">
                <Menu className="size-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background/96">
              <SheetHeader>
                <SheetTitle>SpendWise</SheetTitle>
                <SheetDescription>Navigate the site and access the auth screens.</SheetDescription>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-border hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href && "border-border bg-accent text-accent-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <SheetFooter>
                <Button asChild className="w-full">
                  <Link href="/register">Create an account</Link>
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
