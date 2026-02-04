'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

export default function PerformancesPage() {
  const { data: performances, isLoading, error } = useQuery({
    queryKey: ['performances'],
    queryFn: () => apiClient.getPerformances(),
  });

  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">공연 목록</h1>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">공연 목록을 불러오는데 실패했습니다.</p>
          </div>
        )}

        {performances && performances.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">등록된 공연이 없습니다.</p>
          </div>
        )}

        {performances && performances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performances.map((performance) => (
              <Link key={performance.id} href={`/performances/${performance.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {performance.posterImage && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={performance.posterImage}
                        alt={performance.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{performance.name}</CardTitle>
                    {performance.location && (
                      <CardDescription>{performance.location}</CardDescription>
                    )}
                  </CardHeader>
                  {(performance.startAt || performance.description) && (
                    <CardContent>
                      {performance.startAt && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(performance.startAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                      {performance.description && (
                        <p className="text-sm mt-2 line-clamp-2">{performance.description}</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
