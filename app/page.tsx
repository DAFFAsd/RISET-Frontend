import LocationButton from './LocationButton';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans">
      <main className="flex flex-col items-center justify-center gap-8 p-8 max-w-2xl w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Aplikasi Hilirisasi
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Klik tombol di bawah untuk mengizinkan akses lokasi Anda
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Data lokasi akan dikirim dan diproses secara server-side
          </p>
        </div>

        <LocationButton />

        <div className="mt-8 w-full">
          <Link 
            href="/chat"
            className="block w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 ease-in-out text-center"
          >
            💬 Buka Chat dengan Ollama MCP
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
            Chat AI dengan akses ke MCP tools
          </p>
        </div>
      </main>
    </div>
  );
}
