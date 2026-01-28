import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { Mail, Phone, MapPin, Calendar, CreditCard, ShoppingBag, Gift, UserCheck, ArrowLeft, Plus, Trash2 } from 'lucide-react'
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

interface Order {
  id: string
  created_at: string
  total_pence: number
  status: string
}

interface WalletTransaction {
  id: string
  created_at: string
  amount_pence: number
  type: string
  description: string
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<Profile | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    walletBalance: 0,
  })
  const [showAddBalanceDialog, setShowAddBalanceDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadUser()
      loadRecentOrders()
      loadRecentTransactions()
      loadStats()
    }
  }, [id])

  const loadUser = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setUser(data)
      setSelectedRole(data.role)
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!id) return
    try {
      // Get total orders
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id)
        .eq('status', 'paid')

      // Get total spent
      const { data: orders } = await supabase
        .from('orders')
        .select('total_pence')
        .eq('user_id', id)
        .eq('status', 'paid')

      const totalSpent = orders?.reduce((sum, order) => sum + order.total_pence, 0) || 0

      // Get wallet balance
      const { data: walletData } = await supabase
        .from('wallet_credits')
        .select('remaining_pence')
        .eq('user_id', id)
        .eq('status', 'active')

      const walletBalance =
        walletData?.reduce((sum, credit) => sum + credit.remaining_pence, 0) || 0

      setStats({
        totalOrders: orderCount || 0,
        totalSpent,
        walletBalance,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadRecentOrders = async () => {
    if (!id) return
    try {
      setLoadingOrders(true)
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, total_pence, status')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const loadRecentTransactions = async () => {
    if (!id) return
    try {
      setLoadingTransactions(true)
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('id, created_at, amount_pence, type, description')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!user || !selectedRole) return

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, role: selectedRole })
      alert('User role updated successfully')
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update user role')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-600',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600'
  }

  const handleDeleteUser = async () => {
    if (!user) return

    try {
      setDeleting(true)

      // Delete user using RPC function (this will cascade delete from profiles and all related data)
      const { error } = await supabase.rpc('delete_user', {
        user_id_to_delete: user.id
      })

      if (error) throw error

      // Navigate immediately on success
      navigate('/admin/dashboard/users')
    } catch (error) {
      console.error('Error deleting user:', error)
      setDeleting(false)
      // Keep dialog open to show error
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Users', href: '/admin/dashboard/users' },
            { label: 'Loading...' },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Users', href: '/admin/dashboard/users' },
            { label: 'Not Found' },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">User not found</p>
            <Link
              to="/admin/dashboard/users"
              className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="size-4" />
              Back to Users
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Users', href: '/admin/dashboard/users' },
          { label: user.email },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header with Back Button and Actions */}
          <div className="flex items-center justify-between">
            <Link
              to="/admin/dashboard/users"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to Users
            </Link>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="size-4 mr-2" />
              Delete User
            </Button>
          </div>

          {/* User Profile Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-6">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name || user.email}
                  className="size-24 rounded-full object-cover"
                />
              ) : (
                <div className="size-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-medium">
                  {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">
                  {user.first_name || user.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'No name'}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Mail className="size-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Joined</div>
                    <div className="font-medium">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Role</div>
                    <div className="font-medium capitalize">{user.role?.replace(/_/g, ' ')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingBag className="size-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                  <div className="text-2xl font-semibold">{stats.totalOrders}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CreditCard className="size-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                  <div className="text-2xl font-semibold">£{(stats.totalSpent / 100).toFixed(2)}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Gift className="size-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Wallet Balance</div>
                    <div className="text-2xl font-semibold">£{(stats.walletBalance / 100).toFixed(2)}</div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAddBalanceDialog(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="size-4 mr-1" />
                  Add Balance
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="size-5" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Phone className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div>{user.phone || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Date of Birth</div>
                    <div>
                      {user.date_of_birth
                        ? new Date(user.date_of_birth).toLocaleDateString('en-GB')
                        : 'Not provided'}
                    </div>
                  </div>
                </div>
                {(user.address_line1 || user.city || user.postcode) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="size-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="space-y-1">
                        {user.address_line1 && <div>{user.address_line1}</div>}
                        {user.address_line2 && <div>{user.address_line2}</div>}
                        {(user.city || user.postcode) && (
                          <div>
                            {user.city && user.city}
                            {user.city && user.postcode && ', '}
                            {user.postcode && user.postcode}
                          </div>
                        )}
                        {user.country && <div>{user.country}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role Management & Preferences */}
            <div className="space-y-6">
              {/* Role Management */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Role Management</h3>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedRole || 'user'}
                    onValueChange={(value) => setSelectedRole(value as UserRole)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="influencer">Influencer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleUpdateRole}
                    disabled={updating || selectedRole === user.role}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updating ? 'Updating...' : 'Update Role'}
                  </Button>
                </div>
              </div>

              {/* Marketing Preferences */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Marketing Preferences</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={user.marketing_email || false}
                      disabled
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Email Marketing</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={user.marketing_sms || false}
                      disabled
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">SMS Marketing</span>
                  </label>
                </div>
              </div>

              {/* Referral Info */}
              {user.referral_code && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Gift className="size-5" />
                    Referral Code
                  </h3>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <span className="font-mono font-medium text-lg">{user.referral_code}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="size-5" />
              Recent Orders
            </h3>
            {loadingOrders ? (
              <div className="text-sm text-muted-foreground">Loading orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground">No orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(order.created_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          £{(order.total_pence / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Wallet Transactions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="size-5" />
                Recent Wallet Transactions
              </h3>
              <Button
                onClick={() => setShowAddBalanceDialog(true)}
                size="sm"
                variant="outline"
              >
                <Plus className="size-4 mr-1" />
                Add Balance
              </Button>
            </div>
            {loadingTransactions ? (
              <div className="text-sm text-muted-foreground">Loading transactions...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm capitalize font-medium">{transaction.type}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {transaction.description}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(transaction.created_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'credit' ? '+' : '-'}£
                            {Math.abs(transaction.amount_pence / 100).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Account Metadata */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
            <div>
              User ID: <span className="font-mono">{user.id}</span>
            </div>
            {user.created_at && (
              <div>Created: {new Date(user.created_at).toLocaleString('en-GB')}</div>
            )}
            {user.updated_at && (
              <div>Last Updated: {new Date(user.updated_at).toLocaleString('en-GB')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Balance Dialog */}
      <AddBalanceDialog
        user={user}
        open={showAddBalanceDialog}
        onOpenChange={setShowAddBalanceDialog}
        onSuccess={() => {
          loadStats()
          loadRecentTransactions()
        }}
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
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name || user.email}
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <div className="size-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                  {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium">
                  {user.first_name || user.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'No name'}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>

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
                onClick={() => setShowDeleteDialog(false)}
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
