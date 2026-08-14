import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderAuthControls } from "@/components/header-auth-controls";
import { NotificationsBell } from "@/components/notifications-bell";
import { CorporateLogoBadge } from "@/components/corporate-logo-badge";
import { GnomeLogo } from "@/components/gnome-logo";

export async function SiteHeader() {
  const session = await auth();
  const unreadCount = session?.user
    ? await prisma.notification.count({ where: { userId: session.user.id, isRead: false } })
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <GnomeLogo className="h-9 w-9 shrink-0" />
          <span className="hidden sm:inline">Быстрый помощник</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm text-muted md:flex">
          <Link href="/" className="transition-colors hover:text-foreground">
            Главная
          </Link>
          <Link href="/quiz" className="transition-colors hover:text-foreground">
            Самопроверка
          </Link>
          {session?.user && (
            <>
              <Link href="/favorites" className="transition-colors hover:text-foreground">
                Избранное
              </Link>
              <Link href="/history" className="transition-colors hover:text-foreground">
                История
              </Link>
            </>
          )}
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin" className="transition-colors hover:text-foreground">
              Админ-панель
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user && <NotificationsBell initialUnreadCount={unreadCount} />}
          <ThemeToggle />
          <HeaderAuthControls
            userName={session?.user?.name ?? null}
            userRole={session?.user?.role ?? null}
          />
          <CorporateLogoBadge />
        </div>
      </div>
    </header>
  );
}
