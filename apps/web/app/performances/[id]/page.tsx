'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import type { PerformanceDetail } from '@repo/shared-types';

export default function PerformanceDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: performance, isLoading, error } = useQuery({
    queryKey: ['performance', id],
    queryFn: () => apiClient.getPerformanceById(id),
    enabled: !isNaN(id),
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !performance) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">공연을 찾을 수 없습니다</h1>
          <Link href="/performances">
            <Button>목록으로 돌아가기</Button>
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/performances" className="text-muted-foreground hover:text-primary">
            ← 공연 목록
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {performance.posterImage && (
            <div className="md:col-span-1">
              <img
                src={performance.posterImage}
                alt={performance.name}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          )}
          <div className={performance.posterImage ? 'md:col-span-2' : 'md:col-span-3'}>
            <h1 className="text-3xl font-bold mb-2">{performance.name}</h1>
            {performance.location && (
              <p className="text-muted-foreground mb-2">{performance.location}</p>
            )}
            {performance.startAt && (
              <p className="text-muted-foreground mb-4">
                {new Date(performance.startAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {performance.endAt && (
                  <>
                    {' ~ '}
                    {new Date(performance.endAt).toLocaleDateString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </>
                )}
              </p>
            )}
            {performance.description && (
              <p className="text-lg">{performance.description}</p>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">참여 팀 ({performance.teams.length})</h2>

        {performance.teams.length === 0 ? (
          <p className="text-muted-foreground">등록된 팀이 없습니다.</p>
        ) : (
          <div className="grid gap-6">
            {performance.teams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>
                          {team.songArtist} - {team.songName}
                        </CardDescription>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        팀장: {team.leader.name}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      {team.teamSessions.map((ts) => (
                        <div key={ts.id} className="text-sm">
                          <span className="font-medium">{ts.session.name}</span>
                          <span className="text-muted-foreground ml-1">
                            ({ts.members.length}/{ts.capacity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
