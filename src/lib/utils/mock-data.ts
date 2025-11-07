import { faker } from '@faker-js/faker';
import { User } from '@/types/user';

const USER_ROLES = ['Admin', 'Editor', 'Viewer', 'Manager', 'Developer'] as const;

/**
 * Generate a single mock user with realistic data
 */
export function generateMockUser(overrides?: Partial<User>): User {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    id: faker.string.uuid(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phoneNumber: faker.phone.number('+1 (###) ###-####'),
    avatar: faker.image.avatar(),
    active: faker.datatype.boolean({ probability: 0.85 }), // 85% active users
    role: faker.helpers.arrayElement([...USER_ROLES]),
    bio: faker.helpers.maybe(() => faker.person.bio(), { probability: 0.7 }) || '',
    ...overrides,
  };
}

/**
 * Generate multiple mock users
 */
export function generateMockUsers(count: number): User[] {
  return Array.from({ length: count }, () => generateMockUser());
}

/**
 * Seed data - predefined set of users for consistent testing
 */
export function getSeedUsers(): User[] {
  faker.seed(12345); // Consistent seed for reproducible data
  
  const users = [
    generateMockUser({
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      active: true,
      bio: 'Senior administrator with full system access',
    }),
    generateMockUser({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Manager',
      active: true,
      bio: 'Team lead managing development projects',
    }),
    generateMockUser({
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      role: 'Developer',
      active: true,
    }),
    ...generateMockUsers(17), // Total of 20 seed users
  ];
  
  faker.seed(); // Reset seed to random for subsequent calls
  return users;
}

