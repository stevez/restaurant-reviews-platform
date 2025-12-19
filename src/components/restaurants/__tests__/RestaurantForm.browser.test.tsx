import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
}))

// Mock server actions
vi.mock('@/app/actions/restaurants', () => ({
  createRestaurant: vi.fn(),
  updateRestaurant: vi.fn(),
  uploadImageAction: vi.fn(),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt }: any) {
    return <img src={src} alt={alt} />
  },
}))

// Mock ImageUploader component
vi.mock('../ImageUploader', () => ({
  ImageUploader: function MockImageUploader({ currentImageUrl, onImageChange, disabled }: any) {
    return (
      <div data-testid="image-uploader">
        <label>Restaurant Image</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          disabled={disabled}
          data-testid="image-input"
        />
        {currentImageUrl && <img src={currentImageUrl} alt="Preview" />}
      </div>
    )
  },
}))

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: function MockButton({ children, onClick, disabled, isLoading, type, variant }: any) {
    return (
      <button onClick={onClick} disabled={disabled || isLoading} type={type} data-variant={variant}>
        {children}
      </button>
    )
  },
  Input: function MockInput({ label, value, onChange, type, required, disabled, helperText }: any) {
    return (
      <div>
        <label>{label}</label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-label={label}
        />
        {helperText && <span>{helperText}</span>}
      </div>
    )
  },
  ErrorMessage: function MockErrorMessage({ message }: any) {
    return <div role="alert">{message}</div>
  },
}))

// Import after mocks
const { RestaurantForm } = await import('../RestaurantForm')

describe('RestaurantForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render create form with empty fields', async () => {
      await render(<RestaurantForm mode="create" />)

      await expect.element(page.getByLabelText('Restaurant Name')).toHaveValue('')
      await expect.element(page.getByLabelText('Location')).toHaveValue('')
      await expect.element(page.getByText('Create Restaurant')).toBeVisible()
    })

    it('should update form fields on input', async () => {
      await render(<RestaurantForm mode="create" />)

      const nameInput = page.getByLabelText('Restaurant Name')
      await nameInput.fill('Test Restaurant')
      await expect.element(nameInput).toHaveValue('Test Restaurant')

      const locationInput = page.getByLabelText('Location')
      await locationInput.fill('Test City')
      await expect.element(locationInput).toHaveValue('Test City')
    })

    it('should toggle cuisine selection', async () => {
      await render(<RestaurantForm mode="create" />)

      const italianCheckbox = page.getByLabelText('Italian')
      await expect.element(italianCheckbox).not.toBeChecked()

      await italianCheckbox.click()
      await expect.element(italianCheckbox).toBeChecked()

      await italianCheckbox.click()
      await expect.element(italianCheckbox).not.toBeChecked()
    })

    it('should show error when submitting without cuisine', async () => {
      const { container } = await render(<RestaurantForm mode="create" />)

      const form = container.querySelector('form')!
      form.dispatchEvent(new Event('submit', { bubbles: true }))

      await expect.element(page.getByText('At least one cuisine is required')).toBeVisible()
    })
  })

  describe('Edit Mode', () => {
    it('should render edit mode button text', async () => {
      await render(
        <RestaurantForm
          mode="edit"
          restaurantId="123"
          initialData={{
            title: 'Test Restaurant',
            description: 'Test description',
            location: 'Test location',
            cuisine: ['Italian'],
            imageUrl: undefined
          }}
        />
      )

      await expect.element(page.getByText('Update Restaurant')).toBeVisible()
    })
  })

  describe('Common Functionality', () => {
    it('should handle cancel button click', async () => {
      await render(<RestaurantForm mode="create" />)

      await page.getByText('Cancel').click()
      expect(mockBack).toHaveBeenCalled()
    })

    it('should render submit button', async () => {
      await render(<RestaurantForm mode="create" />)

      const submitButton = page.getByText('Create Restaurant')
      await expect.element(submitButton).toBeVisible()
      await expect.element(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should update description field', async () => {
      const { container } = await render(<RestaurantForm mode="create" />)

      const descriptionTextarea = container.querySelector('textarea')!
      descriptionTextarea.value = 'New description'
      descriptionTextarea.dispatchEvent(new Event('change', { bubbles: true }))
      expect(descriptionTextarea.value).toBe('New description')
    })

    it('should render image uploader', async () => {
      await render(<RestaurantForm mode="create" />)

      await expect.element(page.getByTestId('image-uploader')).toBeVisible()
      await expect.element(page.getByText('Restaurant Image')).toBeVisible()
    })

    it('should handle multiple cuisine selections', async () => {
      await render(<RestaurantForm mode="create" />)

      await page.getByLabelText('Italian').click()
      await page.getByLabelText('French').click()
      await page.getByLabelText('Chinese').click()

      await expect.element(page.getByLabelText('Italian')).toBeChecked()
      await expect.element(page.getByLabelText('French')).toBeChecked()
      await expect.element(page.getByLabelText('Chinese')).toBeChecked()
    })
  })
})
