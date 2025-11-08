import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { ItemList } from '@/components/ItemList'
import type { CollectionItem } from '@/types'

const mockItems: CollectionItem[] = [
  {
    id: '1',
    name: 'Test Item 1',
    description: 'Test Description 1',
    image256: 'data:image/png;base64,test1',
    fingerprint: [1, 2, 3, 4, 5],
    createdAt: Date.now() - 86400000 // Yesterday
  },
  {
    id: '2',
    name: 'Test Item 2',
    description: '',
    image256: 'data:image/png;base64,test2',
    fingerprint: [6, 7, 8, 9, 10],
    createdAt: Date.now() // Today
  }
]

describe('ItemList', () => {
  it('should render empty state when no items', () => {
    render(<ItemList items={[]} />)
    
    expect(screen.getByText('Your Collection (0)')).toBeInTheDocument()
    expect(screen.getByText('No items yet. Click the + button to add your first item!')).toBeInTheDocument()
  })

  it('should render items count correctly', () => {
    render(<ItemList items={mockItems} />)
    
    expect(screen.getByText('Your Collection (2)')).toBeInTheDocument()
  })

  it('should render item cards', () => {
    render(<ItemList items={mockItems} />)
    
    expect(screen.getByText('Test Item 1')).toBeInTheDocument()
    expect(screen.getByText('Test Description 1')).toBeInTheDocument()
    expect(screen.getByText('Test Item 2')).toBeInTheDocument()
  })

  it('should render formatted dates', () => {
    render(<ItemList items={mockItems} />)
    
    const dateElements = screen.getAllByText(/Added/)
    expect(dateElements).toHaveLength(2)
    expect(dateElements[0]).toHaveTextContent('Added ' + new Date(mockItems[0].createdAt).toLocaleDateString())
    expect(dateElements[1]).toHaveTextContent('Added ' + new Date(mockItems[1].createdAt).toLocaleDateString())
  })

  it('should not render description when empty', () => {
    render(<ItemList items={[mockItems[1]]} />)
    
    expect(screen.getByText('Test Item 2')).toBeInTheDocument()
    // Description should not be visible since it's empty
    expect(screen.queryByText('Test Description 2')).not.toBeInTheDocument()
  })

  it('should open image modal when image is clicked', () => {
    render(<ItemList items={mockItems} />)
    
    const images = screen.getAllByRole('img')
    fireEvent.click(images[0])
    
    // Modal should open - check for modal content by looking for the close button
    // The modal is open if we can find the close button
    const closeButton = screen.getByRole('button')
    expect(closeButton).toBeInTheDocument()
    
    // Also check that there are now 3 images (2 in list + 1 in modal)
    const allImages = screen.getAllByRole('img')
    expect(allImages).toHaveLength(3)
  })

  it('should render images with correct attributes', () => {
    render(<ItemList items={mockItems} />)
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'data:image/png;base64,test1')
    expect(images[0]).toHaveAttribute('alt', 'Test Item 1')
    expect(images[1]).toHaveAttribute('src', 'data:image/png;base64,test2')
    expect(images[1]).toHaveAttribute('alt', 'Test Item 2')
  })
})