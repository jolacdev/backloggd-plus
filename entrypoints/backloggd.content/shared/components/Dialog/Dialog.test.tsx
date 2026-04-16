import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';

import Dialog from './Dialog';

describe('Dialog', () => {
  const defaultProps: ComponentProps<typeof Dialog> = {
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    title: 'Test Dialog',
    isOpen: true,
  };

  const defaultKeys = {
    close: 'common.dialog.close',
    submit: 'common.dialog.submit',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  describe('Rendering', () => {
    it('renders title, children, and action buttons', () => {
      const expectedContent = 'Content';
      render(
        <Dialog {...defaultProps}>
          <p>{expectedContent}</p>
        </Dialog>,
      );

      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
      expect(screen.getByText(expectedContent)).toBeInTheDocument();
      expect(screen.getByText(defaultKeys.close)).toBeInTheDocument();
      expect(screen.getByText(defaultKeys.submit)).toBeInTheDocument();
    });

    it('displays custom submit text', () => {
      const expectedSubmitText = 'Save';
      render(<Dialog {...defaultProps} submitText={expectedSubmitText} />);
      expect(screen.getByText(expectedSubmitText)).toBeInTheDocument();
    });

    it('disables submit button when isLoading is true', () => {
      render(<Dialog {...defaultProps} isDisabled={true} />);
      const submitButton = screen.getByText(defaultKeys.submit);
      expect(submitButton.closest('button')).toHaveProperty('disabled', true);
    });
  });

  describe('Visibility', () => {
    it('calls showModal when isOpen is true', () => {
      render(<Dialog {...defaultProps} />);
      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });

    it('calls close when isOpen is false', () => {
      render(<Dialog {...defaultProps} isOpen={false} />);
      expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    });

    it('calls close when isOpen changes to false', () => {
      const { rerender } = render(<Dialog {...defaultProps} />);
      rerender(<Dialog {...defaultProps} isOpen={false} />);
      expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('calls onSubmit when submit button is clicked', async () => {
      render(<Dialog {...defaultProps} />);
      const submitButton = screen.getByText(defaultKeys.submit);
      await userEvent.click(submitButton);
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', async () => {
      render(<Dialog {...defaultProps} />);
      const closeButton = screen.getByText(defaultKeys.close);
      const dialog = screen.getByRole('dialog', { hidden: true });

      await userEvent.click(closeButton);
      // Simulate in JSDOM the dialog's 'close' event that would be triggered in a real browser.
      fireEvent(dialog, new Event('close'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
