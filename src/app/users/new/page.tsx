'use client';

import { useCreateUser } from '@/lib/hooks/use-users';
import UserForm from '@/components/users/user-form';
import { UserFormValues } from '@/lib/schemas/user.schema';
import { useRouter } from 'next/navigation';
import { FormErrorBoundary } from '@/components/error-boundary';
import { parseApiError, fieldErrorsToFormErrors } from '@/lib/utils/api-errors';
import { useState } from 'react';

function NewUserPageContent() {
  const router = useRouter();
  const { mutate: createUser, isPending } = useCreateUser();
  const [serverErrors, setServerErrors] = useState<Record<string, { message: string }>>({});

  const handleSubmit = (data: UserFormValues) => {
    setServerErrors({});
    createUser(data, {
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

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-muted-foreground mt-2">
          Add a new user to the system
        </p>
      </div>
      <UserForm
        mode="create"
        onSubmit={handleSubmit}
        isPending={isPending}
        serverErrors={serverErrors}
      />
    </div>
  );
}

export default function NewUserPage() {
  return (
    <FormErrorBoundary>
      <NewUserPageContent />
    </FormErrorBoundary>
  );
}
