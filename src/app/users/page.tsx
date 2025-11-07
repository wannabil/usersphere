'use client';

import { useState } from 'react';
import { useUsers } from '@/lib/hooks/use-users';
import { useDebounce } from '@/lib/hooks/use-debounce';
import UserTable from '@/components/users/user-table';
import BulkActions from '@/components/users/bulk-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 20;

export default function UsersPage() {
  const { data: users = [], isLoading, error } = useUsers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'createdAt', 
    direction: 'desc' 
  });

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Extract unique roles from users
  const availableRoles = useMemo(() => {
    return Array.from(new Set(users.map(u => u.role)));
  }, [users]);

  // Client-side filtering and sorting with memoization
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = 
          user.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        const matchesRole = !roleFilter || user.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        
        if (aValue === undefined || bValue === undefined) return 0;
        if (aValue > bValue) return direction;
        if (aValue < bValue) return -direction;
        return 0;
      });
  }, [users, debouncedSearchQuery, roleFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setCurrentPage(1); // Reset to first page
  };

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, roleFilter]);

  const hasActiveFilters = searchQuery || roleFilter;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading users</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all users in the system
          </p>
        </div>
        <Button asChild>
          <Link href="/users/new">Add User</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <Select value={roleFilter || undefined} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {selectedIds.length > 0 && (
        <BulkActions
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          selectedIds={selectedIds}
        />
      )}

      <UserTable
        users={paginatedUsers}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
      />

      {filteredUsers.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{' '}
            {filteredUsers.length} users
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {filteredUsers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {debouncedSearchQuery || roleFilter 
              ? 'No users found matching your filters' 
              : 'No users available'}
          </p>
          {(debouncedSearchQuery || roleFilter) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
