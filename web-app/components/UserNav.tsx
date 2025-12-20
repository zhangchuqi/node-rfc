import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';

export async function UserNav() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4" />
        <span className="font-medium">{session.user.email}</span>
        {session.user.name && (
          <span className="text-muted-foreground">({session.user.name})</span>
        )}
      </div>
      <form
        action={async () => {
          'use server';
          const { signOut } = await import('@/lib/auth');
          await signOut({ redirectTo: '/auth/login' });
        }}
      >
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </form>
    </div>
  );
}
