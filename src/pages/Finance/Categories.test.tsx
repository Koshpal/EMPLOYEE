import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Categories from './Categories';
import { FOOD, OLD, SALARY, TRAVEL } from '../../test/fixtures';

const listCategories = vi.fn();
const archiveCategory = vi.fn();
const restoreDefaultCategories = vi.fn();
vi.mock('../../services/category.service', () => ({
  listCategories: (...a: unknown[]) => listCategories(...a),
  archiveCategory: (...a: unknown[]) => archiveCategory(...a),
  restoreDefaultCategories: (...a: unknown[]) => restoreDefaultCategories(...a),
  updateCategory: vi.fn(), createCategory: vi.fn(),
}));
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));
// The shell (sidebar, header, auth) is not what is under test.
vi.mock('../../components/common/Layout', () => ({ Layout: ({ children, headerBelow }: { children: React.ReactNode; headerBelow?: React.ReactNode }) => <div>{headerBelow}{children}</div> }));
vi.mock('../../components/common/HeaderSettingsButton', () => ({ HeaderSettingsButton: () => null }));

const renderPage = () => render(<MemoryRouter><Categories /></MemoryRouter>);

beforeEach(() => { listCategories.mockReset(); archiveCategory.mockReset(); restoreDefaultCategories.mockReset(); });

describe('Categories page states', () => {
  it('shows a loading skeleton first', async () => {
    listCategories.mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByLabelText('Loading categories')).toBeInTheDocument();
  });

  it('shows an error with a working retry', async () => {
    listCategories.mockRejectedValueOnce(new Error('boom')).mockResolvedValue([FOOD]);
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t load your categories/i);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Food & Dining')).toBeInTheDocument();
  });

  it('shows an empty state with a way to restore the defaults', async () => {
    listCategories.mockResolvedValue([]);
    restoreDefaultCategories.mockResolvedValue({ categoriesCreated: 13, categoriesReactivated: 0, subCategoriesCreated: 0, subCategoriesReactivated: 0 });
    renderPage();
    expect(await screen.findByText('No expense categories yet')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Restore defaults' }));
    await waitFor(() => expect(restoreDefaultCategories).toHaveBeenCalled());
  });

  it('separates expense from income and hides archived by default', async () => {
    listCategories.mockResolvedValue([FOOD, TRAVEL, OLD, SALARY]);
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('Food & Dining')).toBeInTheDocument();
    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show 1 archived' }));
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore Gym' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Income/ }));
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument();
  });

  it('searches categories and their subcategories', async () => {
    listCategories.mockResolvedValue([FOOD, TRAVEL]);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Food & Dining');
    await user.type(screen.getByLabelText('Search categories'), 'fuel');
    expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Search categories'));
    await user.type(screen.getByLabelText('Search categories'), 'zzz');
    expect(screen.getByText('No categories match your search')).toBeInTheDocument();
  });

  it('asks before archiving and explains that history is kept', async () => {
    listCategories.mockResolvedValue([FOOD]);
    archiveCategory.mockResolvedValue({ retainedTransactions: 4, activeBudgetLines: 0 });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Food & Dining');
    await user.click(screen.getByRole('button', { name: 'Archive Food & Dining' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/past transactions keep it/i)).toBeInTheDocument();
    expect(archiveCategory).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(archiveCategory).toHaveBeenCalledWith('c-food'));
  });
});
