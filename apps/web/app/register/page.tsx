'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema, type CreateUser } from '@repo/shared-types';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';

interface Generation {
  id: number;
  order: number;
}

interface Session {
  id: number;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: authRegister } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateUser>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      sessions: [],
    },
  });

  const selectedSessions = watch('sessions') || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gens, sess] = await Promise.all([
          apiClient.getGenerations(),
          apiClient.getSessions(),
        ]);
        setGenerations(gens);
        setSessions(sess);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const toggleSession = (sessionId: number) => {
    const current = selectedSessions;
    if (current.includes(sessionId)) {
      setValue(
        'sessions',
        current.filter((id) => id !== sessionId)
      );
    } else {
      setValue('sessions', [...current, sessionId]);
    }
  };

  const onSubmit = async (data: CreateUser) => {
    setError(null);
    setIsLoading(true);

    try {
      await authRegister(data);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>AMANG에 가입하세요</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <FormField>
              <FormLabel error={!!errors.email}>이메일</FormLabel>
              <Input
                type="email"
                placeholder="email@example.com"
                {...register('email')}
              />
              <FormMessage>{errors.email?.message}</FormMessage>
            </FormField>

            <FormField>
              <FormLabel error={!!errors.password}>비밀번호</FormLabel>
              <Input
                type="password"
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                {...register('password')}
              />
              <FormMessage>{errors.password?.message}</FormMessage>
            </FormField>

            <FormField>
              <FormLabel error={!!errors.name}>이름</FormLabel>
              <Input
                type="text"
                placeholder="홍길동"
                {...register('name')}
              />
              <FormMessage>{errors.name?.message}</FormMessage>
            </FormField>

            <FormField>
              <FormLabel error={!!errors.nickname}>닉네임</FormLabel>
              <Input
                type="text"
                placeholder="닉네임을 입력하세요"
                {...register('nickname')}
              />
              <FormMessage>{errors.nickname?.message}</FormMessage>
            </FormField>

            <FormField>
              <FormLabel error={!!errors.generationId}>기수</FormLabel>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('generationId', { valueAsNumber: true })}
              >
                <option value="">기수를 선택하세요</option>
                {generations.map((gen) => (
                  <option key={gen.id} value={gen.id}>
                    {gen.order}기
                  </option>
                ))}
              </select>
              <FormMessage>{errors.generationId?.message}</FormMessage>
            </FormField>

            <FormField>
              <FormLabel error={!!errors.sessions}>세션</FormLabel>
              <div className="flex flex-wrap gap-2">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => toggleSession(session.id)}
                    className={`rounded-md px-3 py-1 text-sm transition-colors ${
                      selectedSessions.includes(session.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {session.name}
                  </button>
                ))}
              </div>
              <FormMessage>{errors.sessions?.message}</FormMessage>
            </FormField>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
            <p className="text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
