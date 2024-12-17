import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface ErrorDialogProps {
  error: string | null;
  onClose: () => void;
}

export const ErrorDialog = ({ error, onClose }: ErrorDialogProps) => {
  return (
    <AlertDialog open={!!error} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Error</AlertDialogTitle>
          <AlertDialogDescription>{error}</AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};