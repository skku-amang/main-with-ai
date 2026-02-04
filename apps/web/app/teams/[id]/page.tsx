'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = Number(params.id);
  const [isApplying, setIsApplying] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { data: team, isLoading, error, refetch } = useQuery({
    queryKey: ['team', id],
    queryFn: () => apiClient.getTeamById(id),
    enabled: !isNaN(id),
  });

  const isLeader = user && team && user.id === team.leader.id;
  const isMember = user && team && team.teamSessions.some((ts) =>
    ts.members.some((m) => m.user.id === user.id)
  );

  const handleApply = async (sessionId: number, index: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsApplying(true);
    try {
      await apiClient.applyToTeam(id, [{ sessionId, index }]);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : '지원에 실패했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('정말 팀에서 나가시겠습니까?')) return;

    setIsLeaving(true);
    try {
      await apiClient.unapplyFromTeam(id, []);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : '팀 탈퇴에 실패했습니다.');
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
          </div>
        </main>
      </>
    );
  }

  if (error || !team) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">팀을 찾을 수 없습니다</h1>
          <Link href="/performances">
            <Button>공연 목록으로 돌아가기</Button>
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
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-primary"
          >
            ← 뒤로 가기
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {team.posterImage && (
            <div className="md:col-span-1">
              <img
                src={team.posterImage}
                alt={team.name}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          )}
          <div className={team.posterImage ? 'md:col-span-2' : 'md:col-span-3'}>
            <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
            <p className="text-xl text-muted-foreground mb-4">
              {team.songArtist} - {team.songName}
            </p>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm">팀장: {team.leader.nickname}</span>
              {team.isFreshmenFixed && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  신입 고정
                </span>
              )}
              {team.isSelfMade && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  자작곡
                </span>
              )}
            </div>
            {team.description && <p className="mb-4">{team.description}</p>}
            {team.songYoutubeVideoUrl && (
              <a
                href={team.songYoutubeVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                YouTube에서 듣기 →
              </a>
            )}

            {isMember && !isLeader && (
              <div className="mt-6">
                <Button
                  variant="destructive"
                  onClick={handleLeave}
                  disabled={isLeaving}
                >
                  {isLeaving ? '처리 중...' : '팀 나가기'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">세션 구성</h2>

        <div className="grid gap-6">
          {team.teamSessions.map((ts) => (
            <Card key={ts.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{ts.session.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {ts.members.length} / {ts.capacity}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: ts.capacity }).map((_, idx) => {
                    const member = ts.members.find((m) => m.index === idx + 1);
                    const isEmpty = !member;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          isEmpty
                            ? 'border-dashed border-muted-foreground/50 bg-muted/30'
                            : 'border-border bg-card'
                        }`}
                      >
                        {member ? (
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
                              {member.user.image ? (
                                <img
                                  src={member.user.image}
                                  alt={member.user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">
                                  {member.user.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-sm">
                              {member.user.nickname}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.user.name}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-2">
                              <span className="text-muted-foreground">?</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {idx + 1}번 자리
                            </p>
                            {user && !isMember && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApply(ts.session.id, idx + 1)}
                                disabled={isApplying}
                              >
                                {isApplying ? '...' : '지원'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
