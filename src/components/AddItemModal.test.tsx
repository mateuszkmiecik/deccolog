import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { AddItemModal } from './AddItemModal'
import { CollectionDB } from '@/lib/db'

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
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
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

describe('AddItemModal', () => {
  let mockDb: CollectionDB
  let mockOnOpenChange: (open: boolean) => void
  let mockOnItemAdded: () => void

  beforeEach(() => {
    mockDb = {
      addItem: vi.fn().mockResolvedValue('test-id'),
    } as any
    mockOnOpenChange = vi.fn() as any
    mockOnItemAdded = vi.fn() as any
    vi.clearAllMocks()
  })

  it('renders dialog when open', () => {
    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByText('Add to Collection')).toBeInTheDocument()
    expect(screen.getByText('Add a new item to your collection. Fill in the details below.')).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    render(
      <AddItemModal
        isOpen={false}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('renders form inputs correctly', () => {
    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    expect(screen.getByTestId('name')).toBeInTheDocument()
    expect(screen.getByTestId('description')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter item name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter item description')).toBeInTheDocument()
  })

  it('shows photo capture buttons when no image is captured', () => {
    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    expect(screen.getByText('Take Photo')).toBeInTheDocument()
    expect(screen.getByText('Upload')).toBeInTheDocument()
  })

  it('updates name and description inputs', async () => {
    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    const nameInput = screen.getByTestId('name')
    const descriptionInput = screen.getByTestId('description')

    fireEvent.change(nameInput, { target: { value: 'Test Item' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })

    expect(nameInput).toHaveValue('Test Item')
    expect(descriptionInput).toHaveValue('Test Description')
  })

  it('shows error when trying to add item without image', async () => {
    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    const addButton = screen.getByText('Add Item')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Please capture an image before adding to collection')).toBeInTheDocument()
    })
  })

  it('handles file upload', async () => {
    const { useImageProcessing } = await import('@/hooks/useImageProcessing')
    const mockProcessImage = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useImageProcessing).mockReturnValue({
      capturedImage: null,
      imageFingerprint: null,
      fingerprintCanvas: null,
      processImage: mockProcessImage,
      clearImage: vi.fn(),
    } as any)

    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    const uploadButton = screen.getByText('Upload')
    fireEvent.click(uploadButton)

    // File input is hidden, so we need to find it
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
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
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    expect(screen.getByText('Remove Photo')).toBeInTheDocument()
    expect(screen.getByText('256x256')).toBeInTheDocument()
    expect(screen.getByText('Fingerprint (32x32)')).toBeInTheDocument()
  })

  it('shows camera view when camera is active', async () => {
    const { useCamera } = await import('@/hooks/useCamera')
    vi.mocked(useCamera).mockReturnValue({
      isCameraActive: true,
      videoRef: { current: null },
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
    } as any)

    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    expect(screen.getByText('Capture')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('adds item successfully when all fields are filled', async () => {
    const { useImageProcessing } = await import('@/hooks/useImageProcessing')
    const mockProcessImage = vi.fn().mockResolvedValue(undefined)
    const mockClearImage = vi.fn()
    
    vi.mocked(useImageProcessing).mockReturnValue({
      capturedImage: 'data:image/jpeg;base64,test',
      imageFingerprint: [1, 2, 3],
      fingerprintCanvas: 'data:image/png;base64,fingerprint',
      processImage: mockProcessImage,
      clearImage: mockClearImage,
    } as any)

    mockDb.addItem = vi.fn().mockResolvedValue('test-id')

    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    const nameInput = screen.getByTestId('name')
    const descriptionInput = screen.getByTestId('description')
    const addButton = screen.getByText('Add Item')

    fireEvent.change(nameInput, { target: { value: 'Test Item' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockDb.addItem).toHaveBeenCalledWith({
        name: 'Test Item',
        description: 'Test Description',
        image256: 'data:image/jpeg;base64,test',
        fingerprint: [1, 2, 3]
      })
    })

    await waitFor(() => {
      expect(mockOnItemAdded).toHaveBeenCalled()
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      expect(mockClearImage).toHaveBeenCalled()
    })
  })

  it('handles database errors gracefully', async () => {
    const { useImageProcessing } = await import('@/hooks/useImageProcessing')
    vi.mocked(useImageProcessing).mockReturnValue({
      capturedImage: 'data:image/jpeg;base64,test',
      imageFingerprint: [1, 2, 3],
      fingerprintCanvas: 'data:image/png;base64,fingerprint',
      processImage: vi.fn(),
      clearImage: vi.fn(),
    } as any)

    mockDb.addItem = vi.fn().mockRejectedValue(new Error('Database error'))

    render(
      <AddItemModal
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onItemAdded={mockOnItemAdded}
        db={mockDb}
      />
    )

    const nameInput = screen.getByTestId('name')
    const addButton = screen.getByText('Add Item')

    fireEvent.change(nameInput, { target: { value: 'Test Item' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to add item to collection')).toBeInTheDocument()
    })
  })
})