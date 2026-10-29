export class InvalidCredentialsError extends Error {
  override readonly name = 'InvalidCredentialsError';
  constructor() {
    super('Invalid credentials');
  }
}

export class PasswordRequiredError extends Error {
  override readonly name = 'PasswordRequiredError';
  constructor() {
    super('A password is required to create a new user');
  }
}

export class TooManyAttemptsError extends Error {
  override readonly name = 'TooManyAttemptsError';
  constructor() {
    super('Too many attempts');
  }
}
