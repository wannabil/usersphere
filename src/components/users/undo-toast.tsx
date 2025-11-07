'use client';

import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UndoToastProps {
  count: number;
  onUndo: () => void;
}

export default function UndoToast({ count, onUndo }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <div className="flex-1">
        <p className="font-medium">
          {count} user{count > 1 ? 's' : ''} deleted
        </p>
        <p className="text-sm text-muted-foreground">
          Undo in {timeLeft} second{timeLeft !== 1 ? 's' : ''}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onUndo}
        className="shrink-0"
      >
        <Undo2 className="mr-2 h-4 w-4" />
        Undo
      </Button>
    </div>
  );
}

