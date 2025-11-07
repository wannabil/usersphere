import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import { useBulkDeleteWithUndo } from '@/lib/hooks/use-bulk-delete';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  selectedIds: string[];
}

export default function BulkActions({
  selectedCount,
  onClearSelection,
  selectedIds,
}: BulkActionsProps) {
  const { bulkDeleteWithUndo, isPending } = useBulkDeleteWithUndo();

  const handleBulkDelete = async () => {
    await bulkDeleteWithUndo(selectedIds);
    onClearSelection();
  };

  return (
    <div className="flex items-center justify-between bg-muted p-4 rounded-lg mb-4">
      <div className="flex items-center gap-4">
        <span className="font-medium">{selectedCount} users selected</span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4 mr-2" />
          Clear Selection
        </Button>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} user{selectedCount > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll have 5 seconds to undo this action before deletion becomes permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

