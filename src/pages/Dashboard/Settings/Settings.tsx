import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components'
import { useAuth } from '@/hooks/useAuth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function Settings() {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Extract username from email or use name
  const username = user?.email ? user.email.split('@')[0] : 'user'

  return (
    <>
      {/* Header */}
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' }
        ]}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
      <div className="px-6 py-8 mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
          <div className="space-y-8">
            {/* Profile Section */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[15px] font-[450] leading-[23px] text-foreground">
                  Profile
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your basic account information
                </p>
              </div>
              <section
                data-slot="settings-list"
                className="rounded-[7px] bg-card border-[0.5px] border-[#DCDCDC] dark:border dark:border-border/80"
              >
                <ul className="min-w-0 min-h-0">
                  {/* Name */}
                  <li
                    data-slot="settings-item"
                    className="relative flex items-center justify-between gap-3 min-h-[60px] px-4 py-3 first:rounded-t-[6px] last:rounded-b-[6px]"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <label className="text-[13px] font-medium leading-normal text-foreground cursor-default">
                          Name
                        </label>
                      </div>
                      <span className="text-[12px] font-[450] leading-normal text-muted-foreground break-words">
                        Your display name across the platform
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[13px] text-foreground">
                        {user?.name || 'Not set'}
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="absolute bottom-0 left-4 right-4 h-px bg-border/50"
                    ></div>
                  </li>

                  {/* Email */}
                  <li
                    data-slot="settings-item"
                    className="relative flex items-center justify-between gap-3 min-h-[60px] px-4 py-3 first:rounded-t-[6px] last:rounded-b-[6px]"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <label className="text-[13px] font-medium leading-normal text-foreground cursor-default">
                          Email
                        </label>
                      </div>
                      <span className="text-[12px] font-[450] leading-normal text-muted-foreground break-words">
                        Your account email address
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[13px] text-muted-foreground">
                        {user?.email || 'Not set'}
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="absolute bottom-0 left-4 right-4 h-px bg-border/50"
                    ></div>
                  </li>

                  {/* Member Since */}
                  <li
                    data-slot="settings-item"
                    className="relative flex items-center justify-between gap-3 min-h-[60px] px-4 py-3 first:rounded-t-[6px] last:rounded-b-[6px]"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <label className="text-[13px] font-medium leading-normal text-foreground cursor-default">
                          Member Since
                        </label>
                      </div>
                      <span className="text-[12px] font-[450] leading-normal text-muted-foreground break-words">
                        When you joined the platform
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[13px] text-muted-foreground">
                        {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </span>
                    </div>
                  </li>
                </ul>
              </section>
            </div>

            {/* Connected Accounts Section */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[15px] font-[450] leading-[23px] text-foreground">
                  Connected Accounts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage how you sign in to your account
                </p>
              </div>
              <section
                data-slot="settings-list"
                className="rounded-[7px] bg-card border-[0.5px] border-[#DCDCDC] dark:border dark:border-border/80"
              >
                <ul className="min-w-0 min-h-0">
                  {/* Google Account */}
                  <li
                    data-slot="settings-item"
                    className="relative flex items-center justify-between gap-3 min-h-[60px] px-4 py-3 first:rounded-t-[6px] last:rounded-b-[6px]"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <label className="text-[13px] font-medium leading-normal text-foreground cursor-default">
                          Google
                        </label>
                      </div>
                      <span className="text-[12px] font-[450] leading-normal text-muted-foreground break-words">
                        Connected {user?.createdAt ? formatDate(user.createdAt) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[13px] text-muted-foreground">
                        @{username}
                      </span>
                    </div>
                  </li>
                </ul>
              </section>
            </div>

            {/* Session Section */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[15px] font-[450] leading-[23px] text-foreground">
                  Session
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage your current session
                </p>
              </div>
              <section
                data-slot="settings-list"
                className="rounded-[7px] bg-card border-[0.5px] border-[#DCDCDC] dark:border dark:border-border/80"
              >
                <ul className="min-w-0 min-h-0">
                  {/* Sign Out */}
                  <li
                    data-slot="settings-item"
                    className="relative flex items-center justify-between gap-3 min-h-[60px] px-4 py-3 first:rounded-t-[6px] last:rounded-b-[6px]"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <label className="text-[13px] font-medium leading-normal text-foreground cursor-default">
                          Sign Out
                        </label>
                      </div>
                      <span className="text-[12px] font-[450] leading-normal text-muted-foreground break-words">
                        End your current session on this device
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                        <button
                          type="button"
                          onClick={() => setShowSignOutDialog(true)}
                          className="relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border bg-clip-padding font-medium outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-6 gap-1 px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1)-1px)] text-xs not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-destructive bg-destructive text-white shadow-destructive/24 shadow-xs hover:bg-destructive/90 [&:is(:active,[data-pressed])]:inset-shadow-[0_1px_--theme(--color-black/8%)] [&:is(:disabled,:active,[data-pressed])]:shadow-none"
                          data-slot="button"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 32 32" className="size-3.5">
                            <polyline points="3 4 3 3 19 3 19 9" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="square" />
                            <polyline points="3 3 13 9 13 30 3 24 3 3" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2" data-cap="butt" strokeLinejoin="miter" strokeLinecap="butt" />
                            <polyline points="19 14 30 14 29 14" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2" data-color="color-2" strokeLinejoin="miter" strokeLinecap="square" />
                            <polyline points="19 19 19 25 13 25" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="square" />
                            <polyline points="24 8 30 14 24 20" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2" data-color="color-2" strokeLinejoin="miter" strokeLinecap="square" />
                          </svg>
                          Sign Out
                        </button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You will be redirected to the login page and will need to sign in again to access your dashboard.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleSignOut}
                              className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
                            >
                              Sign Out
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
