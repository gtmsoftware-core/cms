export class ForbiddenError extends Error {
  override readonly name = 'ForbiddenError';
  constructor() {
    super('Forbidden');
  }
}

export class UserNotFoundError extends Error {
  override readonly name = 'UserNotFoundError';
  constructor() {
    super('User not found');
  }
}

export class EmailAlreadyInUseError extends Error {
  override readonly name = 'EmailAlreadyInUseError';
  constructor() {
    super('Email already in use');
  }
}
