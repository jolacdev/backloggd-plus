import { MouseEvent, ReactNode, SyntheticEvent } from 'react';
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

  useEffect(() => {
    if (!dialogRef.current) return;

    if (isOpen) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const handleClose = (_e: SyntheticEvent<HTMLDialogElement>) => {
    onClose();
  };

  const handleSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={handleClose}>
      <div
        className={cn(
          'modal-box w-[calc(100vw-2rem)] max-w-[36rem] rounded-lg p-0',
          'border border-[var(--back-secondary,#242832)] bg-[var(--back-primary,#16181c)] shadow-2xl',
        )}
      >
        {/* Main content area */}
        <section className="p-4">
          <h4 className="mb-4 text-2xl font-medium">{title}</h4>
          {children}
        </section>

        {/* Footer section for actions */}
        <footer className="modal-action m-0 bg-[var(--back-secondary,#242832)] px-4 py-2">
          <form method="dialog">
            <div className="flex gap-4">
              <Button disabled={isDisabled} variant="secondary">
                {closeText ?? t('close')}
              </Button>
              <Button
                disabled={isDisabled || isSubmitDisabled}
                onClick={handleSubmit}
              >
                {submitText ?? t('submit')}
              </Button>
            </div>
          </form>
        </footer>
      </div>

      {/* Form used to natively close the dialog through backdrop click */}
      <form className="modal-backdrop" method="dialog">
        <button className="cursor-auto" />
      </form>
    </dialog>
  );
};

export default Dialog;
