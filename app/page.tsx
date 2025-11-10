import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-bg">
      <main className="flex flex-col items-center justify-center gap-8 p-8 max-w-2xl w-full">
        <Card className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold mb-2">
              Aplikasi Hilirisasi - Mock
            </CardTitle>
            <CardDescription className="text-lg text-white/80">
              Chat dengan AI Assistant
            </CardDescription>
            <p className="text-sm text-white/60 mt-2">
              Aplikasi akan meminta izin akses lokasi saat Anda membuka chat
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Link href="/chat" className="block w-full">
              <Button 
                className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
                size="lg"
              >
                💬 Buka Chat
              </Button>
            </Link>
            <p className="text-sm text-white/60 text-center">
              Chat AI dengan fitur utilitas lengkap
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
