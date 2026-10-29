export type ActionState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'success'; message?: string }>
  | Readonly<{ status: 'error'; message: string }>;

export const idleState: ActionState = { status: 'idle' };
