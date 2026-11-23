import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionFormModal } from './TransactionFormModal';
import { FOOD, TRAVEL, SALARY, FOOD_BUDGET, MULTI_BUDGET } from '../../test/fixtures';
import type { Transaction } from '../../types/finance.types';

const createTransaction = vi.fn();
const updateTransaction = vi.fn();
const getBudgets = vi.fn();
const listCategories = vi.fn();
vi.mock('../../services/finance.service', () => ({
  createTransaction: (...a: unknown[]) => createTransaction(...a),
  updateTransaction: (...a: unknown[]) => updateTransaction(...a),
  getBudgets: (...a: unknown[]) => getBudgets(...a),
}));
vi.mock('../../services/category.service', () => ({
  listCategories: (...a: unknown[]) => listCategories(...a),
  createCategory: vi.fn(),
}));
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));

beforeEach(() => {
  for (const m of [createTransaction, updateTransaction, getBudgets, listCategories]) m.mockReset();
  listCategories.mockImplementation(async (p: { type?: string } = {}) => [FOOD, TRAVEL, SALARY].filter((c) => !p.type || c.type === p.type));
  getBudgets.mockResolvedValue([FOOD_BUDGET]);
  createTransaction.mockImplementation(async (p) => ({ id: 'new', ...p }));
});

const open = (props: Partial<React.ComponentProps<typeof TransactionFormModal>> = {}) => {
  const onClose = vi.fn();
  render(<TransactionFormModal open onClose={onClose} {...props} />);
  return { onClose, user: userEvent.setup() };
};
const catSelect = () => screen.getByLabelText(/^Category/) as HTMLSelectElement;
const subSelect = () => screen.getByLabelText('Subcategory') as HTMLSelectElement;
const optionsOf = (el: HTMLElement) => within(el).getAllByRole('option').map((o) => o.textContent);

describe('TransactionFormModal', () => {
  it('requires a positive amount', async () => {
    const { user } = open();
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    expect(await screen.findByText('Enter an amount greater than zero')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Amount (₹)'), '12.345');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    expect(await screen.findByText('Use at most two decimal places')).toBeInTheDocument();
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('lists only expense categories for an expense and income ones after switching', async () => {
    const { user } = open();
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Food & Dining'));
    expect(optionsOf(catSelect())).not.toContain('Salary');
    await user.click(screen.getByLabelText('Income'));
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Salary'));
    expect(optionsOf(catSelect())).not.toContain('Food & Dining');
  });

  it('shows only the chosen category’s subcategories, and clears the sub when the category changes', async () => {
    const { user } = open();
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Food & Dining'));
    expect(subSelect()).toBeDisabled();
    await user.selectOptions(catSelect(), 'Food & Dining');
    expect(optionsOf(subSelect())).toEqual(expect.arrayContaining(['Groceries', 'Eating out']));
    await user.selectOptions(subSelect(), 'Groceries');
    expect(subSelect().value).toBe('Groceries');
    await user.selectOptions(catSelect(), 'Transport');
    expect(subSelect().value).toBe('');
    expect(optionsOf(subSelect())).toContain('Fuel');
    expect(optionsOf(subSelect())).not.toContain('Groceries');
  });

  it('choosing a budget does not lock the category; naming a budget category does', async () => {
    getBudgets.mockResolvedValue([MULTI_BUDGET]);
    const { user } = open();
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Food & Dining'));
    await user.selectOptions(catSelect(), 'Transport');
    await waitFor(() => expect(within(screen.getByLabelText(/^Budget$|^Budget \(/)).getByRole('option', { name: 'Monthly Budget' })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText(/^Budget \(optional\)|^Budget$/), 'b-multi');
    // default: "Same as category" — the category stays the user's choice
    expect(await screen.findByLabelText(/Budget category/)).toHaveValue('');
    expect(catSelect().value).toBe('Transport');
    expect(catSelect()).not.toBeDisabled();
    // naming a budget category makes the line decide the category
    await user.selectOptions(screen.getByLabelText(/Budget category/), 'bl-m-food');
    await waitFor(() => expect(catSelect().value).toBe('Food & Dining'));
    expect(catSelect()).toBeDisabled();
    // back to "Same as category" gives the choice back
    await user.selectOptions(screen.getByLabelText(/Budget category/), '');
    await waitFor(() => expect(catSelect()).not.toBeDisabled());
  });

  it('says when the category will be added to the budget, and when it is already there', async () => {
    getBudgets.mockResolvedValue([MULTI_BUDGET]);
    const { user } = open();
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Food & Dining'));
    await user.selectOptions(await screen.findByLabelText(/^Budget/), 'b-multi');
    await user.selectOptions(catSelect(), 'Transport');
    expect(await screen.findByText(/“Transport” isn’t in “Monthly Budget” yet — it will be added/)).toBeInTheDocument();
    await user.selectOptions(catSelect(), 'Food & Dining');
    expect(await screen.findByText(/Counts against “Food & Dining” in this budget/)).toBeInTheDocument();
  });

  it('a multi-line budget with no category and no budget category asks for one', async () => {
    getBudgets.mockResolvedValue([MULTI_BUDGET]);
    const { user } = open();
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Food & Dining'));
    await user.type(screen.getByLabelText('Amount (₹)'), '50');
    await user.selectOptions(await screen.findByLabelText(/^Budget/), 'b-multi');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    expect(await screen.findByText('Pick a category — or a budget category')).toBeInTheDocument();
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('saves with the category only when no budget category is named (the server adds the line)', async () => {
    getBudgets.mockResolvedValue([MULTI_BUDGET]);
    const { user, onClose } = open();
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Food & Dining'));
    await user.type(screen.getByLabelText('Amount (₹)'), '250.50');
    await user.selectOptions(await screen.findByLabelText(/^Budget/), 'b-multi');
    await user.selectOptions(catSelect(), 'Transport');
    await user.selectOptions(subSelect(), 'Fuel');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const sent = createTransaction.mock.calls[0][0];
    expect(sent).toMatchObject({ amount: 250.5, type: 'EXPENSE', category: 'Transport', subCategory: 'Fuel', budgetId: 'b-multi', budgetCategoryId: null });
  });

  it('sends the budget category when the user names one', async () => {
    getBudgets.mockResolvedValue([FOOD_BUDGET]);
    const { user, onClose } = open();
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Food & Dining'));
    await user.type(screen.getByLabelText('Amount (₹)'), '99');
    await user.selectOptions(await screen.findByLabelText(/^Budget/), 'b-food');
    await user.selectOptions(await screen.findByLabelText(/Budget category/), 'bl-food');
    await waitFor(() => expect(catSelect().value).toBe('Food & Dining'));
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createTransaction.mock.calls[0][0]).toMatchObject({ category: 'Food & Dining', budgetId: 'b-food', budgetCategoryId: 'bl-food' });
  });

  it('income never carries a budget', async () => {
    const { user } = open();
    await user.click(screen.getByLabelText('Income'));
    expect(screen.queryByLabelText(/^Budget/)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Amount (₹)'), '1000');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    await waitFor(() => expect(createTransaction).toHaveBeenCalled());
    expect(createTransaction.mock.calls[0][0]).toMatchObject({ type: 'INCOME', budgetId: null });
  });

  it('keeps the form open and shows the server message when saving fails', async () => {
    createTransaction.mockRejectedValue({ response: { data: { message: 'Budget not found' } } });
    const { user, onClose } = open();
    await user.type(screen.getByLabelText('Amount (₹)'), '10');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));
    expect(await screen.findByText('Budget not found')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('bank-reported amount, date and type are read-only when editing an SMS transaction, but filing is allowed', async () => {
    const t = { id: 't1', amount: 499, type: 'EXPENSE', origin: 'SMS', category: 'Uncategorized', transactionDate: new Date().toISOString(), description: 'Swiggy' } as unknown as Transaction;
    updateTransaction.mockImplementation(async (_id, p) => ({ ...t, ...p, warnings: [] }));
    const { user, onClose } = open({ transaction: t });
    expect(screen.getByLabelText('Amount (₹)')).toBeDisabled();
    expect(screen.getByLabelText('Expense')).toBeDisabled();
    await waitFor(() => expect(optionsOf(catSelect())).toContain('Food & Dining'));
    await user.selectOptions(catSelect(), 'Food & Dining');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [, payload] = updateTransaction.mock.calls[0];
    expect(payload).toMatchObject({ category: 'Food & Dining' });
    expect(payload).not.toHaveProperty('amount');
    expect(payload).not.toHaveProperty('transactionDate');
  });
});
