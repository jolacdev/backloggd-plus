import { MouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@globalShared/components/Button';
import { cn } from '@globalShared/utils/cn';

type DialogProps = {
  title: string;
  children?: ReactNode;
  closeText?: string;
  submitText?: string;
  isOpen: boolean;
  isDisabled?: boolean;
  isSubmitDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Renders the Backloggd-style modal shell and footer actions. */
const Dialog = ({
  children = undefined,
  closeText = undefined,
  onClose,
  onConfirm,
  submitText = undefined,
  title,
  isDisabled = false,
  isOpen,
  isSubmitDisabled = false,
}: DialogProps) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'common.dialog' });
  const dialogRef = useRef<HTMLDialogElement>(null);

  const submitLabel = submitText ?? t('submit');
  const closeLabel = closeText ?? t('close');

  useEffect(() => {
    if (!dialogRef.current) return;

    if (isOpen) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const handleSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      className="modal"
      onClose={onClose}
    >
      <div
        className={cn(
          'modal-box w-[calc(100vw-2rem)] max-w-[36rem] rounded-lg p-0',
          'border-section bg-background border shadow-2xl',
        )}
      >
        {/* Main content area */}
        <section className="p-4">
          <h4 className="mb-4 text-2xl font-medium">{title}</h4>
          {children}
        </section>

        {/* Footer section for actions */}
        <footer className="modal-action bg-section m-0 px-4 py-2">
          <form method="dialog">
            <div className="flex gap-4">
              <Button disabled={isDisabled} variant="secondary">
                {closeLabel}
              </Button>
              <Button
                disabled={isDisabled || isSubmitDisabled}
                onClick={handleSubmit}
              >
                {submitLabel}
              </Button>
            </div>
          </form>
        </footer>
      </div>

      {/* Form used to natively close the dialog through backdrop click */}
      <form className="modal-backdrop" method="dialog">
        <button aria-label={closeLabel} className="cursor-auto" tabIndex={-1} />
      </form>
    </dialog>
  );
};

export default Dialog;
