import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { RangeFilter } from './RangeFilter';

describe('RangeFilter', () => {
  it('applies a preset immediately', async () => {
    const onChange = vi.fn();
    render(<RangeFilter value={{ range: 'THIS_MONTH' }} onChange={onChange} />);
    await userEvent.setup().selectOptions(screen.getByLabelText('Period'), 'LAST_3_MONTHS');
    expect(onChange).toHaveBeenCalledWith({ range: 'LAST_3_MONTHS' });
  });

  it('waits for both custom dates before applying', async () => {
    const onChange = vi.fn();
    render(<RangeFilter value={{ range: 'THIS_MONTH' }} onChange={onChange} />);
    await userEvent.setup().selectOptions(screen.getByLabelText('Period'), 'CUSTOM');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/pick both dates/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-01' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-10-31' } });
    expect(onChange).toHaveBeenCalledWith({ range: 'CUSTOM', from: '2026-10-01', to: '2026-10-31' });
  });

  it('refuses a start date after the end date', () => {
    const onChange = vi.fn();
    render(<RangeFilter value={{ range: 'CUSTOM', from: '2026-10-01', to: '2026-10-31' }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-15' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/start date is after the end date/i);
    expect(onChange).not.toHaveBeenCalled();
  });
});
