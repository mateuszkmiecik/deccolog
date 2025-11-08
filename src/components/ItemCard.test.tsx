import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { ItemCard } from '@/components/ItemCard'
import type { CollectionItem } from '@/types'

const mockItem: CollectionItem = {
  id: '1',
  name: 'Test Item',
  description: 'Test Description',
  image256: 'data:image/png;base64,test',
  fingerprint: [1, 2, 3, 4, 5],
  createdAt: Date.now()
}

describe('ItemCard', () => {
  it('should render item information correctly', () => {
    render(<ItemCard item={mockItem} />)
    
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText(/Added/)).toBeInTheDocument()
  })

  it('should render image with correct attributes', () => {
    render(<ItemCard item={mockItem} />)
    
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', 'data:image/png;base64,test')
    expect(image).toHaveAttribute('alt', 'Test Item')
  })

  it('should not render description when empty', () => {
    const itemWithoutDescription = { ...mockItem, description: '' }
    render(<ItemCard item={itemWithoutDescription} />)
    
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('should call onImageClick when image is clicked', () => {
    const mockOnClick = vi.fn()
    render(<ItemCard item={mockItem} onImageClick={mockOnClick} />)
    
    const image = screen.getByRole('img')
    fireEvent.click(image)
    
    expect(mockOnClick).toHaveBeenCalledWith(mockItem)
  })

  it('should not crash when onImageClick is not provided', () => {
    expect(() => {
      render(<ItemCard item={mockItem} />)
      const image = screen.getByRole('img')
      fireEvent.click(image)
    }).not.toThrow()
  })

  it('should render formatted date', () => {
    const testDate = new Date('2023-01-01')
    const itemWithSpecificDate = { ...mockItem, createdAt: testDate.getTime() }
    
    render(<ItemCard item={itemWithSpecificDate} />)
    
    expect(screen.getByText('Added ' + testDate.toLocaleDateString())).toBeInTheDocument()
  })

  it('should apply correct CSS classes', () => {
    render(<ItemCard item={mockItem} />)
    
    const image = screen.getByRole('img')
    expect(image).toHaveClass('w-16', 'h-16', 'rounded-md', 'object-cover', 'bg-black', 'cursor-pointer', 'hover:opacity-80', 'transition-opacity')
    
    // Check the container div
    const container = image.closest('.flex')
    expect(container).toHaveClass('flex', 'gap-4', 'p-4', 'border', 'rounded-lg')
  })
})