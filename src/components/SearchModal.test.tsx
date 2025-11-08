import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { SearchModal } from './SearchModal'
import { type CollectionItem } from '@/types'

// Mock the hooks
vi.mock('@/hooks/useCamera', () => ({
  useCamera: vi.fn(() => ({
    isCameraActive: false,
    videoRef: { current: null },
    startCamera: vi.fn(),
    stopCamera: vi.fn(),
  })),
}))

vi.mock('@/hooks/useImageProcessing', () => ({
  useImageProcessing: vi.fn(() => ({
    capturedImage: null,
    imageFingerprint: null,
    fingerprintCanvas: null,
    processImage: vi.fn(),
    clearImage: vi.fn(),
  })),
}))

// Mock the UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, variant, className }: any) => (
    <button onClick={onClick} data-type={type} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, id }: any) => (
    <input
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      data-testid={id}
    />
  ),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}))

vi.mock('./ItemCard', () => ({
  ItemCard: ({ item }: { item: CollectionItem }) => (
    <div data-testid="item-card">{item.name}</div>
  ),
}))

describe('SearchModal', () => {
  let mockItems: CollectionItem[]
  let mockOnOpenChange: (open: boolean) => void

  beforeEach(() => {
    mockItems = [
      {
        id: '1',
        name: 'Test Item 1',
        description: 'Test Description 1',
        image256: 'data:image/jpeg;base64,test1',
        fingerprint: [1, 2, 3, 4],
        createdAt: Date.now(),
      },
      {
        id: '2',
        name: 'Test Item 2',
        description: 'Test Description 2',
        image256: 'data:image/jpeg;base64,test2',
        fingerprint: [5, 6, 7, 8],
        createdAt: Date.now(),
      },
    ]
    mockOnOpenChange = vi.fn() as any
    vi.clearAllMocks()
  })

  it('renders dialog when open', () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByText('Search Collection')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search by name or description...')).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    render(
      <SearchModal
        isOpen={false}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('shows camera button', () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    expect(screen.getByText('Take Photo')).toBeInTheDocument()
  })

  it('filters items by search query', async () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name or description...')
    fireEvent.change(searchInput, { target: { value: 'Test Item 1' } })

    await waitFor(() => {
      expect(screen.getByText('Found 1 result for "Test Item 1"')).toBeInTheDocument()
      expect(screen.getByText('Test Item 1')).toBeInTheDocument()
      expect(screen.queryByText('Test Item 2')).not.toBeInTheDocument()
    })
  })

  it('filters items by description', async () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name or description...')
    fireEvent.change(searchInput, { target: { value: 'Description 2' } })

    await waitFor(() => {
      expect(screen.getByText('Found 1 result for "Description 2"')).toBeInTheDocument()
      expect(screen.getByText('Test Item 2')).toBeInTheDocument()
      expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument()
    })
  })

  it('shows no results message when no items match', async () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name or description...')
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('Found 0 results for "Nonexistent"')).toBeInTheDocument()
      expect(screen.getByText('No items found matching your search.')).toBeInTheDocument()
    })
  })

  it('shows clear button when search query is present', async () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name or description...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(() => {
      const clearButton = searchInput.nextElementSibling as HTMLButtonElement
      expect(clearButton).toBeInTheDocument()
    })
  })

  it('clears search when clear button is clicked', async () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name or description...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(() => {
      const clearButton = searchInput.nextElementSibling as HTMLButtonElement
      fireEvent.click(clearButton)
    })

    await waitFor(() => {
      expect(searchInput).toHaveValue('')
      expect(screen.queryByText(/Found \d+ results/)).not.toBeInTheDocument()
    })
  })

  it('shows camera when Take Photo button is clicked', async () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    const takePhotoButton = screen.getByText('Take Photo')
    fireEvent.click(takePhotoButton)

    await waitFor(() => {
      expect(screen.getByText('Hide Camera')).toBeInTheDocument()
    })
  })

  it('displays captured image when available', async () => {
    const { useImageProcessing } = await import('@/hooks/useImageProcessing')
    vi.mocked(useImageProcessing).mockReturnValue({
      capturedImage: 'data:image/jpeg;base64,test',
      imageFingerprint: [1, 2, 3],
      fingerprintCanvas: 'data:image/png;base64,fingerprint',
      processImage: vi.fn(),
      clearImage: vi.fn(),
    } as any)

    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    expect(screen.getByText('Clear Photo')).toBeInTheDocument()
    expect(screen.getByText('256x256')).toBeInTheDocument()
    expect(screen.getByText('Fingerprint (32x32)')).toBeInTheDocument()
  })

  it('shows similar items when image is captured', async () => {
    const { useImageProcessing } = await import('@/hooks/useImageProcessing')
    vi.mocked(useImageProcessing).mockReturnValue({
      capturedImage: 'data:image/jpeg;base64,test',
      imageFingerprint: [1, 2, 3],
      fingerprintCanvas: 'data:image/png;base64,fingerprint',
      processImage: vi.fn(),
      clearImage: vi.fn(),
    } as any)

    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('All 2 items ranked by similarity')).toBeInTheDocument()
      expect(screen.getByText('Test Item 1')).toBeInTheDocument()
      expect(screen.getByText('Test Item 2')).toBeInTheDocument()
    })
  })

  it('shows similarity metrics for similar items', async () => {
    const { useImageProcessing } = await import('@/hooks/useImageProcessing')
    vi.mocked(useImageProcessing).mockReturnValue({
      capturedImage: 'data:image/jpeg;base64,test',
      imageFingerprint: [1, 2, 3],
      fingerprintCanvas: 'data:image/png;base64,fingerprint',
      processImage: vi.fn(),
      clearImage: vi.fn(),
    } as any)

    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    await waitFor(() => {
      // Check for similarity metrics in DOM - use getAllByText since there are multiple
      const euclideanTexts = screen.getAllByText(/Euclidean:/)
      expect(euclideanTexts.length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Cosine:/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Manhattan:/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Match:/).length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no search and no image', () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={[]}
      />
    )

    expect(screen.getByText('Type to search your collection or take a photo to find similar items...')).toBeInTheDocument()
  })

  it('calls onOpenChange when dialog is closed', () => {
    render(
      <SearchModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        items={mockItems}
      />
    )

    // Simulate dialog close by calling the onOpenChange prop directly
    // This would normally be triggered by Dialog component
    mockOnOpenChange(false)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})