import { toast } from 'sonner';
import { useCare } from '../context/CareContext.tsx';
import { CareError } from '../services/care.ts';

export function useSave() {
  const { refresh } = useCare();
  return (work: () => void, success: string) => {
    try {
      work();
      toast.success(success);
      refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof CareError ? error.message : 'That change could not be saved in this browser.');
      return false;
    }
  };
}
