'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  iconColor?: 'primary' | 'emerald' | 'violet' | 'orange' | 'rose' | 'blue';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
  className?: string;
}

const Icons = {
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

const iconColorClasses = {
  primary: 'from-primary-500 to-primary-600',
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
  rose: 'from-rose-500 to-rose-600',
  blue: 'from-blue-500 to-blue-600',
};

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'lg',
  title,
  subtitle,
  icon,
  iconColor = 'primary',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-white rounded-2xl shadow-2xl 
          max-h-[90vh] flex flex-col
          animate-modal-enter
          my-auto
          ${className}
        `}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          zIndex: 10000,
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex-shrink-0 px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {icon && (
                  <div className={`
                    w-12 h-12 rounded-xl 
                    bg-gradient-to-br ${iconColorClasses[iconColor]}
                    flex items-center justify-center text-white
                    shadow-lg shadow-${iconColor}-500/30
                  `}>
                    {icon}
                  </div>
                )}
                <div>
                  {title && (
                    <h2 id="modal-title" className="text-xl font-bold text-slate-800">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    p-2.5 rounded-xl
                    text-slate-400 hover:text-slate-600
                    hover:bg-slate-100 
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50
                  "
                  aria-label="Modal schließen"
                >
                  {Icons.close}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

// Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const variantClasses = {
    danger: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-rose-100 text-rose-600',
      button: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500/50',
    },
    warning: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/50',
    },
    info: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50',
    },
  };

  const { icon, iconBg, button } = variantClasses[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <div className="p-6 text-center">
        <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-4`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className="
              px-5 py-2.5 rounded-xl font-medium
              text-slate-600 bg-slate-100 
              hover:bg-slate-200 
              transition-all duration-200
              disabled:opacity-50
            "
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`
              px-5 py-2.5 rounded-xl font-medium
              text-white ${button}
              transition-all duration-200
              disabled:opacity-50
              focus:outline-none focus:ring-2
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Lädt...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
