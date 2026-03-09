import { toast } from 'sonner'

/**
 * Detects if the current page is in the admin area
 */
const isAdminPage = (): boolean => {
  return window.location.pathname.startsWith('/admin')
}

/**
 * Client toast styling - matches the warm, friendly design system
 */
const getClientToastStyle = (type: 'error' | 'success' | 'warning' | 'info') => {
  const baseStyle = {
    border: '2px solid',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '500',
    backdropFilter: 'blur(8px)',
  }

  switch (type) {
    case 'error':
      return {
        ...baseStyle,
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        color: '#dc2626',
      }
    case 'success':
      return {
        ...baseStyle,
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        color: '#15803d',
      }
    case 'warning':
      return {
        ...baseStyle,
        backgroundColor: '#fef3c7',
        borderColor: '#fde68a',
        color: '#92400e',
      }
    case 'info':
      return {
        ...baseStyle,
        backgroundColor: '#e1eaec',
        borderColor: '#496B71',
        color: '#496B71',
      }
  }
}

/**
 * Admin toast styling - uses CSS variables from the admin theme
 */
const getAdminToastClassName = (type: 'error' | 'success' | 'warning' | 'info') => {
  switch (type) {
    case 'error':
      return 'bg-admin-error-bg border-2 border-admin-error-border text-admin-error-text'
    case 'success':
      return 'bg-admin-success-bg border-2 border-admin-success-fg text-admin-success-text'
    case 'warning':
      return 'bg-admin-warning-bg border-2 border-admin-warning-fg text-admin-warning-fg'
    case 'info':
      return 'bg-admin-info-bg border-2 border-admin-info-fg text-admin-info-text'
  }
}

/**
 * Shows an error toast with styling appropriate for the current context
 */
export const showErrorToast = (message: string) => {
  if (isAdminPage()) {
    toast.error(message, {
      className: getAdminToastClassName('error'),
    })
  } else {
    toast.error(message, {
      style: getClientToastStyle('error'),
    })
  }
}

/**
 * Shows a success toast with styling appropriate for the current context
 */
export const showSuccessToast = (message: string) => {
  if (isAdminPage()) {
    toast.success(message, {
      className: getAdminToastClassName('success'),
    })
  } else {
    toast.success(message, {
      style: getClientToastStyle('success'),
    })
  }
}

/**
 * Shows a warning toast with styling appropriate for the current context
 */
export const showWarningToast = (message: string) => {
  if (isAdminPage()) {
    toast.warning(message, {
      className: getAdminToastClassName('warning'),
    })
  } else {
    toast.warning(message, {
      style: getClientToastStyle('warning'),
    })
  }
}

/**
 * Shows an info toast with styling appropriate for the current context
 */
export const showInfoToast = (message: string) => {
  if (isAdminPage()) {
    toast.info(message, {
      className: getAdminToastClassName('info'),
    })
  } else {
    toast.info(message, {
      style: getClientToastStyle('info'),
    })
  }
}
