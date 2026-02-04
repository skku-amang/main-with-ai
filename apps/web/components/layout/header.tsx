'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          AMANG
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/performances" className="text-sm hover:text-primary">
            공연
          </Link>
          {user && (
            <Link href="/profile" className="text-sm hover:text-primary">
              프로필
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">{user.nickname}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                로그아웃
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
