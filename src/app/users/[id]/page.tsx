'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useUpdateUser } from '@/lib/hooks/use-users';
import UserForm from '@/components/users/user-form';
import { UserFormValues } from '@/lib/schemas/user.schema';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormErrorBoundary } from '@/components/error-boundary';
import { parseApiError, fieldErrorsToFormErrors } from '@/lib/utils/api-errors';
import { useState } from 'react';
import { checkForConflicts } from '@/lib/utils/conflict-detection';
import { ConflictDialog } from '@/components/users/conflict-dialog';
import { usersApi } from '@/lib/api/users';
import { User } from '@/types/user';

function EditUserPageContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading, error, refetch } = useUser(userId);
  const { mutate: updateUser, isPending } = useUpdateUser(userId);
  const [serverErrors, setServerErrors] = useState<Record<string, { message: string }>>({});
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictServerVersion, setConflictServerVersion] = useState<User | null>(null);
  const [pendingChanges, setPendingChanges] = useState<UserFormValues | null>(null);

  const handleSubmit = async (data: UserFormValues) => {
    setServerErrors({});
    
    // Check for conflicts before submitting
    const { hasConflict, serverUser } = await checkForConflicts(
      userId,
      user,
      () => usersApi.getUser(userId)
    );
    
    if (hasConflict && serverUser) {
      // Show conflict dialog
      setConflictServerVersion(serverUser);
      setPendingChanges(data);
      setConflictDialogOpen(true);
      return;
    }
    
    // No conflict, proceed with update
    submitUpdate(data);
  };
  
  const submitUpdate = (data: UserFormValues) => {
    updateUser(data, {
      onSuccess: () => {
        router.push('/users');
      },
      onError: (error: any) => {
        const { fieldErrors } = parseApiError(error);
        if (fieldErrors.length > 0) {
          setServerErrors(fieldErrorsToFormErrors(fieldErrors));
        }
      },
    });
  };
  
  const handleKeepServerVersion = () => {
    setConflictDialogOpen(false);
    refetch(); // Reload server version
    router.push('/users');
  };
  
  const handleOverwrite = () => {
    setConflictDialogOpen(false);
    if (pendingChanges) {
      submitUpdate(pendingChanges);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg border border-destructive/20">
          <h2 className="text-lg font-semibold mb-2">Error Loading User</h2>
          <p className="mb-4">
            Unable to load user data. The user may have been deleted or does not exist.
          </p>
          <Button onClick={() => router.push('/users')} variant="outline">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit User</h1>
        <p className="text-muted-foreground mt-2">
          Update user information for {user.name}
        </p>
      </div>
      <UserForm
        mode="edit"
        defaultValues={{
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          active: user.active,
          avatar: user.avatar || '',
          bio: user.bio || '',
        }}
        onSubmit={handleSubmit}
        isPending={isPending}
        serverErrors={serverErrors}
      />
      
      {conflictServerVersion && (
        <ConflictDialog
          open={conflictDialogOpen}
          onOpenChange={setConflictDialogOpen}
          serverVersion={conflictServerVersion}
          onKeepServer={handleKeepServerVersion}
          onOverwrite={handleOverwrite}
        />
      )}
    </div>
  );
}

export default function EditUserPage() {
  return (
    <FormErrorBoundary>
      <EditUserPageContent />
    </FormErrorBoundary>
  );
}
