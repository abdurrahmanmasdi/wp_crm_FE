'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MemberProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0e14] to-[#161b22] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0e14]/80 p-8 shadow-2xl backdrop-blur-sm">
        {/* Header Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[#00f0ff]/10 p-4">
            <div className="text-2xl text-[#00f0ff]">👤</div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold text-[#dfe2eb]">
          Member Profile
        </h1>

        {/* Description */}
        <p className="mb-8 text-center text-sm text-[#bacac5]">
          Detailed user activity and performance metrics are currently in
          development.
        </p>

        {/* Info Box */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-[#8b949e]">
            <span className="font-semibold text-[#bacac5]">Member ID:</span>{' '}
            {params.id}
          </p>
        </div>

        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className="w-full bg-[#00f0ff] font-semibold text-[#003731] hover:bg-[#00f0ff]/90"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team
        </Button>

        {/* Alternative Link */}
        <Button
          variant="outline"
          className="mt-3 w-full border-white/10 text-[#bacac5] hover:bg-white/5"
          onClick={() => router.push('/dashboard/settings')}
        >
          Go to Settings
        </Button>
      </div>
    </div>
  );
}
