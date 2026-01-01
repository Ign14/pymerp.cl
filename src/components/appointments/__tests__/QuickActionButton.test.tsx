import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickActionButton from '../QuickActionButton';

describe('QuickActionButton', () => {
  it('renders with label and icon', () => {
    const mockClick = vi.fn();
    
    render(
      <QuickActionButton
        icon="📅"
        label="Test Action"
        description="Test description"
        onClick={mockClick}
      />
    );
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test Action' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockClick = vi.fn();
    
    render(
      <QuickActionButton
        icon="📅"
        label="Test Action"
        onClick={mockClick}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Test Action' });
    fireEvent.click(button);
    
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const mockClick = vi.fn();
    
    render(
      <QuickActionButton
        icon="📅"
        label="Test Action"
        onClick={mockClick}
        disabled={true}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Test Action' });
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('has correct accessibility attributes', () => {
    const mockClick = vi.fn();
    
    render(
      <QuickActionButton
        icon="📅"
        label="Agenda manual"
        onClick={mockClick}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Agenda manual' });
    expect(button).toHaveAttribute('aria-label', 'Agenda manual');
    expect(button).toHaveAttribute('type', 'button');
  });
});

