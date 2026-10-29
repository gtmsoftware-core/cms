import { InvalidCredentialsError, TooManyAttemptsError } from '../errors';
import type { Authenticator, RateLimiter } from '../ports';
import { signInSchema, type SignInInput } from '../schemas/sign-in.schema';

export type SignInDeps = Readonly<{ authenticator: Authenticator; rateLimiter: RateLimiter }>;

export function makeSignIn({ authenticator, rateLimiter }: SignInDeps) {
  return async function signIn(input: SignInInput): Promise<void> {
    const { email, password } = signInSchema.parse(input);
    if (!rateLimiter.attempt(`sign-in:${email}`)) throw new TooManyAttemptsError();
    if (!(await authenticator.signIn(email, password))) throw new InvalidCredentialsError();
  };
}
