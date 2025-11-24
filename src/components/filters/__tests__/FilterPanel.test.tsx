import { render, screen, fireEvent } from '@testing-library/react'
import { FilterPanel } from '../FilterPanel'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Button component to simplify testing
jest.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled, isLoading, variant, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  ),
}))

describe('FilterPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render filter panel with default values', () => {
    render(<FilterPanel />)

    expect(screen.getByText('Sort By')).toBeInTheDocument()
    expect(screen.getByText('Minimum Rating')).toBeInTheDocument()
    expect(screen.getByText('Cuisine')).toBeInTheDocument()
    expect(screen.getByText('Apply Filters')).toBeInTheDocument()
  })

  it('should render with initial values', () => {
    render(
      <FilterPanel
        initialCuisines={['Italian', 'French']}
        initialMinRating={4}
        initialSort="worst"
      />
    )

    const italianCheckbox = screen.getByLabelText('Italian') as HTMLInputElement
    const frenchCheckbox = screen.getByLabelText('French') as HTMLInputElement
    const worstRadio = screen.getByLabelText('Worst Rated') as HTMLInputElement

    expect(italianCheckbox.checked).toBe(true)
    expect(frenchCheckbox.checked).toBe(true)
    expect(worstRadio.checked).toBe(true)
  })

  it('should toggle cuisine selection', () => {
    render(<FilterPanel />)

    const italianCheckbox = screen.getByLabelText('Italian') as HTMLInputElement
    expect(italianCheckbox.checked).toBe(false)

    fireEvent.click(italianCheckbox)
    expect(italianCheckbox.checked).toBe(true)

    fireEvent.click(italianCheckbox)
    expect(italianCheckbox.checked).toBe(false)
  })

  it('should change minimum rating', () => {
    render(<FilterPanel />)

    const ratingSelects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    // First combobox is Minimum Rating, second is Location
    const ratingSelect = ratingSelects[0]
    expect(ratingSelect.value).toBe('0')

    fireEvent.change(ratingSelect, { target: { value: '4' } })
    expect(ratingSelect.value).toBe('4')
  })

  it('should change sort order', () => {
    render(<FilterPanel />)

    const worstRadio = screen.getByLabelText('Worst Rated') as HTMLInputElement
    expect(worstRadio.checked).toBe(false)

    fireEvent.click(worstRadio)
    expect(worstRadio.checked).toBe(true)
  })

  it('should have apply filters button', () => {
    render(<FilterPanel />)

    expect(screen.getByText('Apply Filters')).toBeInTheDocument()
  })

  it('should show reset button when filters are active', () => {
    render(<FilterPanel initialCuisines={['Italian']} />)

    expect(screen.getByText('Reset Filters')).toBeInTheDocument()
  })

  it('should not show reset button when no filters are active', () => {
    render(<FilterPanel />)

    expect(screen.queryByText('Reset Filters')).not.toBeInTheDocument()
  })

  it('should reset filter states when reset button is clicked', () => {
    render(
      <FilterPanel
        initialCuisines={['Italian', 'French']}
        initialMinRating={4}
        initialSort="worst"
        initialLocation="New York"
      />
    )

    fireEvent.click(screen.getByText('Reset Filters'))

    // Check that all filters are reset to default values after clicking
    const italianCheckbox = screen.getByLabelText('Italian') as HTMLInputElement
    const frenchCheckbox = screen.getByLabelText('French') as HTMLInputElement
    const bestRadio = screen.getByLabelText('Best Rated') as HTMLInputElement
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    const ratingSelect = selects[0]
    const locationSelect = selects[1]

    expect(italianCheckbox.checked).toBe(false)
    expect(frenchCheckbox.checked).toBe(false)
    expect(bestRadio.checked).toBe(true)
    expect(ratingSelect.value).toBe('0')
    expect(locationSelect.value).toBe('')
  })

  it('should handle multiple cuisine selections', () => {
    render(<FilterPanel />)

    fireEvent.click(screen.getByLabelText('Italian'))
    fireEvent.click(screen.getByLabelText('French'))
    fireEvent.click(screen.getByLabelText('Chinese'))

    expect((screen.getByLabelText('Italian') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('French') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Chinese') as HTMLInputElement).checked).toBe(true)
  })

  it('should render all cuisine types', () => {
    render(<FilterPanel />)

    expect(screen.getByLabelText('Italian')).toBeInTheDocument()
    expect(screen.getByLabelText('French')).toBeInTheDocument()
    expect(screen.getByLabelText('Chinese')).toBeInTheDocument()
    expect(screen.getByLabelText('Japanese')).toBeInTheDocument()
    expect(screen.getByLabelText('Mexican')).toBeInTheDocument()
  })

  it('should render all rating options', () => {
    render(<FilterPanel />)

    const selects = screen.getAllByRole('combobox')
    const ratingSelect = selects[0]
    expect(ratingSelect).toBeInTheDocument()

    // Check that options include expected values
    const options = Array.from(ratingSelect.querySelectorAll('option')).map((opt) => opt.value)
    expect(options).toContain('0')
    expect(options).toContain('3')
    expect(options).toContain('4')
  })

  it('should render location filter', () => {
    render(<FilterPanel />)

    expect(screen.getByText('Location')).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox')
    const locationSelect = selects[1]
    expect(locationSelect).toBeInTheDocument()
  })

  it('should change location', () => {
    render(<FilterPanel />)

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    const locationSelect = selects[1]
    expect(locationSelect.value).toBe('')

    fireEvent.change(locationSelect, { target: { value: 'New York' } })
    expect(locationSelect.value).toBe('New York')
  })

  it('should render with initial location', () => {
    render(<FilterPanel initialLocation="Chicago" />)

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    const locationSelect = selects[1]
    expect(locationSelect.value).toBe('Chicago')
  })
})
