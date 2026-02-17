import { MouseEvent, ReactNode, SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../Button';

type DialogProps = {
  title: string;
  children?: ReactNode;
  submitText?: string;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

const Dialog = ({
  children = undefined,
  onClose,
  onSubmit,
  submitText = undefined,
  title,
  isLoading = false,
  isOpen,
}: DialogProps) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'common.dialog' });
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialogRef.current) {
      return;
    }

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
    onSubmit();
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={handleClose}>
      <div className="modal-box border border-[var(--back-secondary)] bg-[var(--back-primary)] p-0">
        {/* Main content area */}
        <section className="p-4">
          <h4 className="mb-4 text-2xl font-medium">{title}</h4>
          {children}
        </section>

        {/* Footer section for actions */}
        <footer className="modal-action m-0 bg-[var(--back-secondary)] px-4 py-2">
          <form method="dialog">
            <div className="flex gap-4">
              <Button variant="secondary">{t('close')}</Button>
              <Button disabled={isLoading} onClick={handleSubmit}>
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
