import { motion } from 'framer-motion'
import { Wallet, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { formatDistanceToNow } from 'date-fns'

export function WalletSection() {
  const { summary, credits, transactions, isLoading } = useWallet()

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const balanceGBP = summary.availableBalance / 100
  const expiringGBP = summary.expiringBalance / 100

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="size-5" />
            <h2 className="text-lg font-bold">Wallet Balance</h2>
          </div>
        </div>
        <div className="text-4xl font-bold mb-2">£{balanceGBP.toFixed(2)}</div>
        <p className="text-orange-100 text-sm">Available site credit</p>

        {expiringGBP > 0 && summary.nextExpiryDate && (
          <div className="mt-4 pt-4 border-t border-orange-400/30 flex items-center gap-2 text-sm">
            <AlertCircle className="size-4" />
            <span>
              £{expiringGBP.toFixed(2)} expiring{' '}
              {formatDistanceToNow(new Date(summary.nextExpiryDate), { addSuffix: true })}
            </span>
          </div>
        )}
      </motion.div>

      {/* Active Credits */}
      {credits.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-lg mb-4">Active Credits</h3>
          <div className="space-y-3">
            {credits.map((credit) => (
              <div
                key={credit.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{credit.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="size-3" />
                      Expires {formatDistanceToNow(new Date(credit.expires_at), { addSuffix: true })}
                    </span>
                    {credit.isExpiringSoon && (
                      <span className="text-xs text-orange-600 font-medium">Expiring Soon!</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">£{(credit.remaining_pence / 100).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="size-5" />
            Recent Transactions
          </h3>
          <div className="space-y-2">
            {transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold text-sm ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}£{Math.abs(tx.amount_pence / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Balance: £{(tx.balance_after_pence / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {credits.length === 0 && transactions.length === 0 && balanceGBP === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Wallet className="size-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-gray-600 mb-2">No Wallet Activity Yet</h3>
          <p className="text-gray-500 text-sm">
            Win site credit from instant-win competitions to see it here!
          </p>
        </div>
      )}
    </div>
  )
}
