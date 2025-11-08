import { render, screen, fireEvent } from '@testing-library/preact'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { ImageModal } from './ImageModal'
import { type CollectionItem } from '@/types'

// Mock the UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, variant, size, className }: any) => (
    <button onClick={onClick} data-type={type} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}))

describe('ImageModal', () => {
  let mockItem: CollectionItem
  let mockOnOpenChange: (open: boolean) => void

  beforeEach(() => {
    mockItem = {
      id: '1',
      name: 'Test Item',
      description: 'Test Description',
      image256: 'data:image/jpeg;base64,test',
      fingerprint: [1, 2, 3, 4],
      createdAt: Date.now(),
    }
    mockOnOpenChange = vi.fn() as any
    vi.clearAllMocks()
  })

  it('renders dialog when open and item is provided', () => {
    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
      />
    )

    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-header')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    render(
      <ImageModal
        isOpen={false}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
      />
    )

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('does not render when item is null', () => {
    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={null}
      />
    )

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('displays item name in title', () => {
    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
      />
    )

    expect(screen.getByText('Test Item')).toBeInTheDocument()
  })

  it('displays item image', () => {
    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
      />
    )

    const image = screen.getByAltText('Test Item')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,test')
    expect(image).toHaveClass('max-w-full', 'rounded-lg', 'border', 'bg-black')
  })

  it('displays item description when provided', () => {
    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
      />
    )

    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('does not display description when not provided', () => {
    const itemWithoutDescription = {
      ...mockItem,
      description: '',
    }

    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={itemWithoutDescription}
      />
    )

    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('displays creation date', () => {
    const testDate = new Date('2023-01-01')
    const itemWithDate = {
      ...mockItem,
      createdAt: testDate.getTime(),
    }

    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={itemWithDate}
      />
    )

    expect(screen.getByText(`Added ${testDate.toLocaleDateString()}`)).toBeInTheDocument()
  })

  it('displays image size information', () => {
    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
      />
    )

    expect(screen.getByText('Image size: 256x256 pixels')).toBeInTheDocument()
  })

  it('calls onOpenChange when close button is clicked', () => {
    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
      />
    )

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('close button has correct attributes', () => {
    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
      />
    )

    const closeButton = screen.getByRole('button')
    expect(closeButton).toHaveAttribute('data-type', 'button')
    expect(closeButton).toHaveAttribute('data-variant', 'ghost')
    expect(closeButton).toHaveAttribute('data-size', 'sm')
  })

  it('renders with different item names', () => {
    const differentItem = {
      ...mockItem,
      name: 'Different Item Name',
    }

    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={differentItem}
      />
    )

    expect(screen.getByText('Different Item Name')).toBeInTheDocument()
    expect(screen.getByAltText('Different Item Name')).toBeInTheDocument()
  })

  it('renders with long description', () => {
    const longDescription = 'This is a very long description that should wrap properly and still be displayed correctly in the modal dialog.'
    const itemWithLongDescription = {
      ...mockItem,
      description: longDescription,
    }

    render(
      <ImageModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        item={itemWithLongDescription}
      />
    )

    expect(screen.getByText(longDescription)).toBeInTheDocument()
  })
})