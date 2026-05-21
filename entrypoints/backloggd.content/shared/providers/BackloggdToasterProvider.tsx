import { MouseEvent, ReactNode } from 'react';
import toast, { resolveValue, Toast, ToastBar, Toaster } from 'react-hot-toast';

import { cn } from '@globalShared/utils/cn';

type BackloggdToasterProviderProps = {
  children: ReactNode;
};

const BackloggdToasterProvider = ({
  children,
}: BackloggdToasterProviderProps) => {
  const baseBackloggdToastClasses = cn(
    'flex items-center justify-between gap-2',
    'w-[300px] px-[16px] py-[10px]',
    'rounded-[4px] bg-[var(--back-pink-dk,#ea377a)] text-[#ffffff]',
    'pointer-events-auto select-none opacity-80 hover:opacity-100',
  );

  const handleDismiss = (e: MouseEvent<HTMLButtonElement>, t: Toast) => {
    e.stopPropagation(); // Avoid potentially triggering onClick of the toast itself
    toast.dismiss(t.id);
  };

  return (
    <>
      {children}
      <Toaster
        gutter={12}
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className: baseBackloggdToastClasses,
          duration: 5000,
          removeDelay: 0,
          error: {
            className: cn(
              baseBackloggdToastClasses,
              'bg-[#fdedec] text-[#ff5757]',
            ),
          },
        }}
      >
        {(t) => (
          <ToastBar
            style={{
              ...t.style,
            }}
            toast={t}
          >
            {({ message }) => (
              <>
                {resolveValue(message, t)}
                {t.type !== 'loading' && (
                  <button
                    className="font-bold opacity-70 hover:cursor-pointer hover:opacity-100"
                    onClick={(e) => handleDismiss(e, t)}
                  >
                    ✕
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </>
  );
};
export default BackloggdToasterProvider;
