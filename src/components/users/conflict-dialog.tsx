'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User } from '@/types/user';

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverVersion: User;
  onKeepServer: () => void;
  onOverwrite: () => void;
}

export function ConflictDialog({
  open,
  onOpenChange,
  serverVersion,
  onKeepServer,
  onOverwrite,
}: ConflictDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Concurrent Modification Detected</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This user was modified by another user while you were editing.
            </p>
            <div className="bg-muted p-3 rounded-md mt-4">
              <p className="font-semibold text-sm mb-2">Current server values:</p>
              <ul className="text-sm space-y-1">
                <li><span className="font-medium">Name:</span> {serverVersion.name}</li>
                <li><span className="font-medium">Email:</span> {serverVersion.email}</li>
                <li><span className="font-medium">Role:</span> {serverVersion.role}</li>
                <li><span className="font-medium">Active:</span> {serverVersion.active ? 'Yes' : 'No'}</li>
              </ul>
            </div>
            <p className="text-sm mt-4">
              You can either keep the server's version or overwrite it with your changes.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onKeepServer}>
            Keep Server Version
          </AlertDialogCancel>
          <AlertDialogAction onClick={onOverwrite}>
            Overwrite with My Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

