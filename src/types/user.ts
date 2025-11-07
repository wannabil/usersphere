export interface User {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  active: boolean;
  role: string;
  bio?: string;
}

export type CreateUserDto = Omit<User, 'id' | 'createdAt'>;
export type UpdateUserDto = Partial<CreateUserDto>;

// Legacy aliases for backward compatibility
export interface CreateUserInput {
  name: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  active: boolean;
  role: string;
  bio: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  active?: boolean;
  role?: string;
  bio?: string;
}

