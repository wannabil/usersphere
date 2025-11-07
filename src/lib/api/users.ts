import { User, CreateUserDto, UpdateUserDto } from '@/types/user';
import { getSeedUsers, generateMockUser } from '@/lib/utils/mock-data';

// Comment out MockAPI - using faker library instead
// const API_BASE = 'https://68ff8c08e02b16d1753e6ed3.mockapi.io/maia/api/v1';

// In-memory store using faker-generated data
let mockUsers: User[] = getSeedUsers();

// Simulate network delay for realistic testing
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const usersApi = {
  // Fetch all users
  getUsers: async (): Promise<User[]> => {
    await delay();
    return [...mockUsers];
  },

  // Fetch single user
  getUser: async (id: string): Promise<User> => {
    await delay();
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return { ...user };
  },

  // Create new user
  createUser: async (data: CreateUserDto): Promise<User> => {
    await delay();
    const newUser = generateMockUser({
      ...data,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    });
    mockUsers.push(newUser);
    return { ...newUser };
  },

  // Update existing user
  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    await delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    mockUsers[index] = { ...mockUsers[index], ...data };
    return { ...mockUsers[index] };
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    mockUsers.splice(index, 1);
  },

  // Bulk delete
  bulkDeleteUsers: async (ids: string[]): Promise<void> => {
    await delay(500); // Slightly longer delay for bulk operation
    mockUsers = mockUsers.filter(u => !ids.includes(u.id));
  },
};
