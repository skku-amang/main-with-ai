'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.getMe(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || isLoading || !profile) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8" />
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-muted rounded w-1/2" />
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">내 프로필</h1>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{profile.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <CardTitle>{profile.nickname}</CardTitle>
                  <CardDescription>{profile.name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">이메일</span>
                <p>{profile.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">기수</span>
                <p>{profile.generation.order}기</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">세션</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.sessions.map((session) => (
                    <span
                      key={session.id}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                    >
                      {session.name}
                    </span>
                  ))}
                </div>
              </div>
              {profile.bio && (
                <div>
                  <span className="text-sm text-muted-foreground">자기소개</span>
                  <p>{profile.bio}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">가입일</span>
                <p>
                  {new Date(profile.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {profile.isAdmin && (
                <div className="pt-2">
                  <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                    관리자
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
