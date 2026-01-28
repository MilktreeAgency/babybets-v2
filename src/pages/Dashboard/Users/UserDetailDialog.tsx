import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Mail, Phone, MapPin, Calendar, CreditCard, ShoppingBag, Gift, UserCheck } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserRole = Database['public']['Enums']['user_role']

interface Order {
  id: string
  created_at: string
  total_pence: number
  subtotal_pence: number
  status: string
}

interface WalletTransaction {
  id: string
  created_at: string
  amount_pence: number
  type: string
  description: string
}

interface UserDetailDialogProps {
  user: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function UserDetailDialog({ user, open, onOpenChange, onUserUpdated }: UserDetailDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [updating, setUpdating] = useState(false)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role)
      loadRecentOrders()
      loadRecentTransactions()
    }
  }, [user])

  const loadRecentOrders = async () => {
    if (!user) return
    try {
      setLoadingOrders(true)
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, total_pence, subtotal_pence, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentOrders((data as Order[]) || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const loadRecentTransactions = async () => {
    if (!user) return
    try {
      setLoadingTransactions(true)
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('id, created_at, amount_pence, type, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentTransactions((data as WalletTransaction[]) || [])
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

      onUserUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update user role')
    } finally {
      setUpdating(false)
    }
  }

  if (!user) return null

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-0">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Header */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="size-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-medium">
              {(user.first_name?.[0] || user.email[0]).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                {user.first_name || user.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : 'No name'}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Mail className="size-4" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <UserCheck className="size-4" />
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                <span>{user.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                <span>
                  {user.date_of_birth
                    ? new Date(user.date_of_birth).toLocaleDateString('en-GB')
                    : 'No DOB'}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          {(user.address_line1 || user.city || user.postcode) && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="size-4" />
                Address
              </h4>
              <div className="text-sm space-y-1">
                {user.address_line1 && <p>{user.address_line1}</p>}
                {user.address_line2 && <p>{user.address_line2}</p>}
                {(user.city || user.postcode) && (
                  <p>
                    {user.city && user.city}
                    {user.city && user.postcode && ', '}
                    {user.postcode && user.postcode}
                  </p>
                )}
                {user.country && <p>{user.country}</p>}
              </div>
            </div>
          )}

          {/* Role Management */}
          <div>
            <h4 className="font-semibold mb-3">Role Management</h4>
            <div className="flex items-center gap-3">
              <Select value={selectedRole || 'user'} onValueChange={(value) => setSelectedRole(value as UserRole)}>
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
          <div>
            <h4 className="font-semibold mb-3">Marketing Preferences</h4>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={user.marketing_email || false}
                  disabled
                  className="rounded border-gray-300"
                />
                <span>Email Marketing</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={user.marketing_sms || false}
                  disabled
                  className="rounded border-gray-300"
                />
                <span>SMS Marketing</span>
              </label>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Recent Orders
            </h4>
            {loadingOrders ? (
              <div className="text-sm text-muted-foreground">Loading orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground">No orders yet</div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <div>
                      <div className="font-medium">Order #{order.id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.created_at!).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">£{(order.subtotal_pence / 100).toFixed(2)}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Wallet Transactions */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="size-4" />
              Recent Wallet Transactions
            </h4>
            {loadingTransactions ? (
              <div className="text-sm text-muted-foreground">Loading transactions...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions yet</div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium capitalize">{transaction.type}</div>
                      <div className="text-xs text-muted-foreground">{transaction.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'credit' ? '+' : '-'}£
                        {Math.abs(transaction.amount_pence / 100).toFixed(2)}
                      </span>
                      <div className="text-xs text-muted-foreground w-20 text-right">
                        {new Date(transaction.created_at!).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referral Info */}
          {user.referral_code && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Gift className="size-4" />
                Referral Information
              </h4>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">Referral Code: </span>
                  <span className="font-mono font-medium">{user.referral_code}</span>
                </div>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <div>
              User ID: <span className="font-mono">{user.id}</span>
            </div>
            {user.created_at && (
              <div>
                Joined: {new Date(user.created_at).toLocaleString('en-GB')}
              </div>
            )}
            {user.updated_at && (
              <div>
                Last Updated: {new Date(user.updated_at).toLocaleString('en-GB')}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
