import { prisma } from '@/lib/prisma';
import { UserList } from '@/components/users/UserList';
import { UserActions } from '@/components/users/UserActions';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <UserActions />
        <UserList users={users} />
      </div>
    </div>
  );
} 