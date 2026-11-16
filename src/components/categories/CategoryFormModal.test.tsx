import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFormModal } from './CategoryFormModal';
import { FOOD, OLD, cat } from '../../test/fixtures';

const createCategory = vi.fn();
const updateCategory = vi.fn();
vi.mock('../../services/category.service', () => ({
  createCategory: (...a: unknown[]) => createCategory(...a),
  updateCategory: (...a: unknown[]) => updateCategory(...a),
}));

const setup = (props: Partial<React.ComponentProps<typeof CategoryFormModal>> = {}) => {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<CategoryFormModal open existing={[FOOD, OLD]} onClose={onClose} onSaved={onSaved} {...props} />);
  return { onClose, onSaved, user: userEvent.setup() };
};

beforeEach(() => { createCategory.mockReset(); updateCategory.mockReset(); });

describe('CategoryFormModal', () => {
  it('will not submit an empty name', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Create category' }));
    expect(await screen.findByText('Give the category a name')).toBeInTheDocument();
    expect(createCategory).not.toHaveBeenCalled();
  });

  it('blocks a duplicate of an active category (case and spacing insensitive)', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Name'), '  food &   DINING ');
    await user.click(screen.getByRole('button', { name: 'Create category' }));
    expect(await screen.findByText(/already have an expense category called/i)).toBeInTheDocument();
    expect(createCategory).not.toHaveBeenCalled();
  });

  it('says an archived name will be restored instead of calling it a duplicate', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Name'), 'gym');
    expect(screen.getByText(/is archived — saving will bring it back/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore category' })).toBeInTheDocument();
  });

  it('allows the same name in the other type (income vs expense)', async () => {
    createCategory.mockResolvedValue(cat({ id: 'n', name: 'Food & Dining', type: 'INCOME' }));
    const { user, onSaved } = setup();
    await user.click(screen.getByLabelText('Income'));
    await user.type(screen.getByLabelText('Name'), 'Food & Dining');
    await user.click(screen.getByRole('button', { name: 'Create category' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(createCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Food & Dining', type: 'INCOME' }));
  });

  it('creates with the trimmed name, then closes', async () => {
    createCategory.mockResolvedValue(cat({ id: 'n', name: 'Pets' }));
    const { user, onClose, onSaved } = setup();
    await user.type(screen.getByLabelText('Name'), '  Pets ');
    await user.click(screen.getByRole('button', { name: 'Create category' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Pets', type: 'EXPENSE' }));
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 'n' }), 'created');
  });

  it('shows the server error and stays open when saving fails', async () => {
    createCategory.mockRejectedValue({ response: { data: { message: 'Name already used' } } });
    const { user, onClose } = setup();
    await user.type(screen.getByLabelText('Name'), 'Pets');
    await user.click(screen.getByRole('button', { name: 'Create category' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Name already used');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cannot change the type of an existing category', () => {
    setup({ category: FOOD });
    expect(screen.getByLabelText('Expense')).toBeDisabled();
    expect(screen.getByLabelText('Income')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('does not treat the category being edited as its own duplicate', async () => {
    updateCategory.mockResolvedValue(FOOD);
    const { user, onSaved } = setup({ category: FOOD });
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(FOOD, 'updated'));
  });
});
