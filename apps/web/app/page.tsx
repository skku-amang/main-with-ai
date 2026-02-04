import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">AMANG</h1>
        <p className="text-lg text-muted-foreground mb-8">성균관대학교 밴드 동아리 관리 시스템</p>
        <div className="flex gap-4">
          <Link href="/performances">
            <Button size="lg">공연 보기</Button>
          </Link>
        </div>
      </main>
    </>
  );
}
