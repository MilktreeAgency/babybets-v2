import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardHeader } from '../components'
import { Search, Eye, Wallet, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AddBalanceDialog } from './AddBalanceDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserRole = Database['public']['Enums']['user_role']

interface UserWithStats extends Profile {
  total_orders?: number
  total_spent_pence?: number
  wallet_balance_pence?: number
}

export default function Users() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [addBalanceDialogOpen, setAddBalanceDialogOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [roleFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Load stats for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (user) => {
          // Get total orders
          const { count: orderCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'paid')

          // Get total spent
          const { data: orders } = await supabase
            .from('orders')
            .select('total_pence')
            .eq('user_id', user.id)
            .eq('status', 'paid')

          const totalSpent = orders?.reduce((sum, order) => sum + order.total_pence, 0) || 0

          // Get wallet balance
          const { data: walletData } = await supabase
            .from('wallet_credits')
            .select('remaining_pence')
            .eq('user_id', user.id)
            .eq('status', 'active')

          const walletBalance =
            walletData?.reduce((sum, credit) => sum + credit.remaining_pence, 0) || 0

          return {
            ...user,
            total_orders: orderCount || 0,
            total_spent_pence: totalSpent,
            wallet_balance_pence: walletBalance,
          }
        })
      )

      setUsers(usersWithStats)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase()
    const email = user.email.toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })

  const getRoleBadgeColor = (role: UserRole | null) => {
    const colors: Record<UserRole, string> = {
      user: 'bg-gray-100 text-gray-800',
      influencer: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      super_admin: 'bg-red-100 text-red-800',
    }
    return role ? colors[role] : 'bg-gray-100 text-gray-800'
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeleting(true)

      // Delete user using RPC function (this will cascade delete from profiles and all related data)
      const { error } = await supabase.rpc('delete_user', {
        user_id_to_delete: userToDelete.id
      })

      if (error) throw error

      // Reload users and close dialog on success
      setShowDeleteDialog(false)
      setUserToDelete(null)
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      // Keep dialog open to show error
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Users' }]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Users</h1>
              <p className="text-muted-foreground mt-1">
                Manage user accounts, roles, and view user activity
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Users: <span className="font-semibold text-foreground">{users.length}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wallet Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.first_name || user.email}
                                className="size-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="size-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-foreground">
                                {user.first_name || user.last_name
                                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                  : 'No name'}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {user.total_orders || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          £{((user.total_spent_pence || 0) / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={
                              (user.wallet_balance_pence || 0) > 0
                                ? 'text-green-600 font-medium'
                                : 'text-muted-foreground'
                            }
                          >
                            £{((user.wallet_balance_pence || 0) / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setAddBalanceDialogOpen(true)
                              }}
                              className="inline-flex items-center gap-1"
                            >
                              <Wallet className="size-4" />
                              Add Balance
                            </Button>
                            <Link
                              to={`/admin/dashboard/users/${user.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                            >
                              <Eye className="size-4" />
                              View
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(user)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddBalanceDialog
        user={selectedUser}
        open={addBalanceDialogOpen}
        onOpenChange={setAddBalanceDialogOpen}
        onSuccess={loadUsers}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Info */}
            {userToDelete && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                {userToDelete.avatar_url ? (
                  <img
                    src={userToDelete.avatar_url}
                    alt={userToDelete.first_name || userToDelete.email}
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                    {(userToDelete.first_name?.[0] || userToDelete.email[0]).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium">
                    {userToDelete.first_name || userToDelete.last_name
                      ? `${userToDelete.first_name || ''} ${userToDelete.last_name || ''}`.trim()
                      : 'No name'}
                  </div>
                  <div className="text-sm text-muted-foreground">{userToDelete.email}</div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Deleting this user will also delete:
              </p>
              <ul className="mt-2 text-sm text-yellow-800 list-disc list-inside space-y-1">
                <li>All orders and order items</li>
                <li>All wallet credits and transactions</li>
                <li>All competition entries and tickets</li>
                <li>All related data</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setUserToDelete(null)
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
