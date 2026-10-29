import type { ActionState } from '@/shared/action-state';
import { Alert, AlertDescription } from '@/presentation/ui';

export function FormStatus({ state }: { state: ActionState }) {
  if (state.status === 'error') {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }
  if (state.status === 'success' && state.message) {
    return (
      <Alert role="status">
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }
  return null;
}
