# React + TypeScript Interview Notes

## 1. Deriving Types from Constants

### `as const` assertion
Creates readonly literal types from arrays/objects:
```typescript
export const CUISINE_TYPES = ['Italian', 'French', 'Chinese'] as const
// Type: readonly ['Italian', 'French', 'Chinese']
```

### Derive union type from const array
```typescript
export type CuisineType = typeof CUISINE_TYPES[number]
// Type: 'Italian' | 'French' | 'Chinese'
```
Note: This is compile-time only, no runtime cost.

### Derive type from object values
```typescript
export const SORT_OPTIONS = [
  { value: 'best', label: 'Best Rated' },
  { value: 'worst', label: 'Worst Rated' },
] as const

type SortOrder = typeof SORT_OPTIONS[number]['value']
// Type: 'best' | 'worst'
```

---

## 2. Zod + TypeScript Integration

### Infer TypeScript type from Zod schema
```typescript
import { z } from 'zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
})

type User = z.infer<typeof userSchema>
// Type: { name: string; age: number }
```

### Use const array with Zod enum for runtime + compile-time validation
```typescript
export const CUISINE_TYPES = ['Italian', 'French', 'Chinese'] as const

const schema = z.object({
  cuisine: z.array(z.enum(CUISINE_TYPES)).min(1, 'At least one required'),
})
```

---

## 3. Component Patterns

### Props interface (preferred over inline)
```typescript
export interface FilterPanelProps {
  initialCuisines?: CuisineType[]
  initialMinRating?: number
  initialSort?: SortOrder
}

export function FilterPanel({
  initialCuisines = [],
  initialMinRating = 0,
  initialSort = 'best',
}: FilterPanelProps) {
  // ...
}
```

### Avoid `React.FC` - use direct function typing
```typescript
// Discouraged
const Task: React.FC<TaskProps> = ({ task }) => { ... }

// Preferred
function Task({ task }: TaskProps) { ... }
// or
const Task = ({ task }: TaskProps) => { ... }
```

### Return types on components
- Common practice: Let TypeScript infer (less boilerplate)
- If explicit needed: use `React.ReactElement`
- `ReactElement` = definitely JSX element
- `ReactNode` = ReactElement | string | number | null | undefined

---

## 4. useState Patterns

### Functional update pattern
Use when new state depends on previous state:
```typescript
// Direct update - may use stale value
setSelectedCuisines([...selectedCuisines, cuisine])

// Functional update - always gets latest state
setSelectedCuisines((prev) => [...prev, cuisine])
```

### When to use functional updates:
1. New state depends on old state
2. Multiple updates might batch together
3. To avoid stale closure issues in event handlers

### Classic bug example:
```typescript
const handleClick = () => {
  setCount(count + 1)  // If count=0, sets to 1
  setCount(count + 1)  // Still uses count=0, sets to 1 again!
}

// Fix:
const handleClick = () => {
  setCount(prev => prev + 1)  // 0 → 1
  setCount(prev => prev + 1)  // 1 → 2 ✓
}
```

### Toggle pattern for arrays (immutable)
```typescript
const handleCuisineToggle = (cuisine: CuisineType) => {
  setSelectedCuisines((prev) =>
    prev.includes(cuisine)
      ? prev.filter((c) => c !== cuisine)  // Remove
      : [...prev, cuisine]                  // Add
  )
}
```

---

## 5. Type Overriding with Omit

When external types (e.g., Prisma) don't match your domain types:
```typescript
import { Restaurant } from '@prisma/client'

// Prisma stores cuisine as string[], but we want CuisineType[]
type RestaurantWithRating = Omit<Restaurant, 'cuisine'> & {
  cuisine: CuisineType[]
  averageRating: number
}
```

Pattern: "Validate on write, cast on read"
- Write: Zod validates at form submission
- Read: Cast at server action level so consumers get clean types

---

## 6. Declaration Merging for Global Types

Instead of unsafe `as unknown as` casts:
```typescript
// src/types/global.d.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export {}
```

Then use cleanly:
```typescript
// src/lib/db.ts
export const prisma = globalThis.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
```

---

## 7. Type Narrowing vs Type Assertion

### Type assertion (trust the programmer)
```typescript
const sortOrder = searchParams.sort as SortOrder
```

### Type narrowing (runtime validation)
```typescript
const sortOrder: SortOrder =
  searchParams.sort === 'best' || searchParams.sort === 'worst'
    ? searchParams.sort
    : 'best'
```

Prefer narrowing at system boundaries (URL params, API responses, user input).

---

## 8. Interface `extends` vs Type Intersection `&`

### `extends` - for inheritance/extension
```typescript
interface JWTPayload extends AuthPayload {
  exp: number
  iat: number
}
```

### `&` - for combining types
```typescript
type RestaurantWithOwner = Restaurant & {
  owner: { id: string; name: string }
}
```

Key differences:
- `extends` shows clear hierarchy, better error messages
- `&` more flexible, can combine any types
- `interface` can be augmented (declaration merging)
- `type` cannot be reopened

---

## 9. Event Handler Typing

### Inline (common)
```typescript
const onSubmit = (data: RestaurantInput) => { ... }
```

### Explicit DOM event types
```typescript
const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => { ... }
const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => { ... }
```

Both are valid - be consistent across the codebase.

---

## 10. useTransition (React 18 Concurrent Feature)

### Basic usage
```typescript
const [isPending, startTransition] = useTransition()
```

TypeScript automatically infers the tuple types:
- `isPending` → `boolean`
- `startTransition` → `(callback: () => void) => void`

### What it does
Marks state updates as **non-urgent/interruptible**, keeping UI responsive:

```typescript
const handleApplyFilters = () => {
  startTransition(() => {
    // This navigation is "low priority"
    // UI stays responsive while it processes
    router.push(`/?${queryString}`)
  })
}
```

### Using `isPending` for loading states
```typescript
<Button
  onClick={handleApplyFilters}
  isLoading={isPending}    // Shows spinner while transitioning
  disabled={isPending}     // Prevents double-clicks
>
  Apply Filters
</Button>
```

### When to use `useTransition`:
1. Navigation that might be slow
2. Filtering/sorting large lists
3. Any update where you want to show "loading" without blocking input

### vs regular loading state with useState
```typescript
// useState approach - blocks UI
const [isLoading, setIsLoading] = useState(false)
const handleClick = async () => {
  setIsLoading(true)
  await slowOperation()
  setIsLoading(false)
}

// useTransition approach - UI stays responsive
const [isPending, startTransition] = useTransition()
const handleClick = () => {
  startTransition(() => {
    slowOperation()  // React can interrupt if needed
  })
}
```

Key difference: React can **interrupt** a transition if more urgent updates come in (like user typing).

---

## 11. Function Return Type Syntax

### Arrow functions
Return type goes after parameters, before the arrow:
```typescript
// Basic
const getName = (): string => 'John'

// With parameters
const add = (a: number, b: number): number => a + b

// Union/complex return type
const getSavedPreferences = (): SavedFilterPreferences | null => {
  // ...
}

// Async function (returns Promise)
const fetchData = async (): Promise<User[]> => {
  const res = await fetch('/api/users')
  return res.json()
}

// With generic
const first = <T>(arr: T[]): T | undefined => arr[0]
```

### Regular functions
Same placement - after parameters, before body:
```typescript
function getName(): string {
  return 'John'
}

function add(a: number, b: number): number {
  return a + b
}

async function fetchData(): Promise<User[]> {
  const res = await fetch('/api/users')
  return res.json()
}
```

### When to add explicit return types:
- **Add**: Public API functions, complex return types, async functions
- **Skip**: Simple functions where inference is obvious, callbacks

### Common mistake
```typescript
// Wrong (space before colon is unconventional)
const fn = () : string => 'hello'

// Correct (no space before colon)
const fn = (): string => 'hello'
```

---

## 12. Type-Only Imports (`import type`)

### Basic syntax
```typescript
// Regular import (included in JS bundle)
import { restaurantSchema, RestaurantInput } from '@/lib/validators'

// Type-only import (erased at compile time)
import { restaurantSchema, type RestaurantInput } from '@/lib/validators'
```

### When to use `type`
Use for imports only used in type annotations, never at runtime:
```typescript
// CuisineType only used for type annotations
import { CUISINE_TYPES, type CuisineType } from '@/lib/constants'

// CUISINE_TYPES used at runtime: CUISINE_TYPES.map(...)
// CuisineType used for types: (cuisine: CuisineType) => ...
```

### Benefits
1. **Smaller bundles** - Types are removed during compilation
2. **Clearer intent** - Shows this is only for type checking
3. **Avoids circular dependencies** - Type-only imports don't create runtime dependencies
4. **Required with `isolatedModules`** - Some bundlers (Babel/SWC) need explicit type imports

### Alternative syntax
```typescript
// Inline (preferred - more concise)
import { CUISINE_TYPES, type CuisineType } from '@/lib/constants'

// Separate statements
import type { CuisineType } from '@/lib/constants'
import { CUISINE_TYPES } from '@/lib/constants'
```

### Note
Both with and without `type` work - TypeScript erases types either way. Using `type` is a best practice for explicitness and consistency.

---

## 13. React Hook Form + Zod

### Basic setup
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { restaurantSchema, type RestaurantInput } from '@/lib/validators'

const {
  register,
  handleSubmit,
  formState: { errors },
  watch,
  setValue,
  setError,
  control,
} = useForm<RestaurantInput>({
  resolver: zodResolver(restaurantSchema),
  mode: 'onBlur',           // Validate on blur
  reValidateMode: 'onChange', // Re-validate on change after first error
  defaultValues: { title: '', cuisine: [] },
})
```

### `register` - For native inputs
Binds field name + handles onChange/onBlur/ref automatically:
```typescript
<input {...register('title')} />
// Spreads: { name: 'title', onChange, onBlur, ref }
```

### `register` options - Value transformers
```typescript
// valueAsNumber: Convert string to number (for select/input)
<select {...register('rating', { valueAsNumber: true })}>
// User selects "5" (string) → stored as 5 (number)

// setValueAs: Custom transformation
<textarea {...register('comment', {
  setValueAs: (v) => v?.trim() || undefined
})} />
// "  hello  " → "hello", "   " → undefined
```

Common `setValueAs` patterns:
```typescript
setValueAs: (v) => v?.trim()           // Remove whitespace
setValueAs: (v) => v?.toUpperCase()    // Uppercase
setValueAs: (v) => v || null           // Empty to null (for DB)
setValueAs: (v) => v ? new Date(v) : undefined  // Parse date
```

Flow: `User types → setValueAs transforms → form state → Zod validates`

### `reset` - Clear form
```typescript
reset()  // Reset to defaultValues, clear errors

// Reset to new values
reset({ rating: 5, comment: '' })

// With options
reset(values, { keepErrors: true, keepDirty: true })
```

Use cases:
- After successful submission (clear for next entry)
- Cancel button (discard changes)
- Reset to initial values when editing

### `watch` - Read values reactively
Use when you need the current value to render UI:
```typescript
const cuisine = watch('cuisine')
// Triggers re-render when cuisine changes

// Watch multiple fields
const [title, location] = watch(['title', 'location'])
```

### `setValue` - Write values programmatically
```typescript
setValue('cuisine', newValue, { shouldValidate: true })
```

### `register` vs `watch`/`setValue`

| | `register` | `watch`/`setValue` |
|---|---|---|
| **Use for** | Native inputs (input, select, textarea) | Custom components, arrays |
| **Binding** | Automatic (uncontrolled) | Manual (controlled) |
| **Re-renders** | Minimal | On every watch change |

### Controller - For custom components
When `register` can't attach a ref (custom components):
```typescript
import { Controller } from 'react-hook-form'

<Controller
  name="imageUrl"
  control={control}
  render={({ field, fieldState }) => (
    <ImageUploader
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  )}
/>
```

### Error handling
```typescript
// Field errors (from Zod validation)
{errors.title?.message && <p>{errors.title.message}</p>}

// Root-level errors (set manually for server errors)
setError('root', { message: 'Server error occurred' })
{errors.root?.message && <ErrorMessage message={errors.root.message} />}
```

### Validation flow
```
User submits → handleSubmit(onSubmit)
       ↓
zodResolver validates with Zod schema
       ↓
If fails → errors object populated, onSubmit NOT called
If passes → errors cleared, onSubmit called with validated data
```

### Form modes
- `mode: 'onBlur'` - Validate when field loses focus (good UX)
- `mode: 'onChange'` - Validate on every keystroke (can be noisy)
- `mode: 'onSubmit'` - Only validate on submit (default)
- `reValidateMode` - How to re-validate after first error

---

## 14. Non-null Assertion Operator (`!`)

### What it does
Tells TypeScript "trust me, this value is not null/undefined":
```typescript
await updateRestaurant(restaurantId!, data)
// restaurantId is string | undefined, but ! asserts it's string
```

### When it's safe
When logic guarantees the value exists, but TypeScript can't infer it:
```typescript
interface Props {
  mode: 'create' | 'edit'
  restaurantId?: string  // Optional
}

// In onSubmit:
const result = mode === 'create'
  ? await createRestaurant(data)
  : await updateRestaurant(restaurantId!, data)  // edit mode = restaurantId exists
```

### Alternative: Runtime check (safer)
```typescript
if (mode === 'edit') {
  if (!restaurantId) {
    throw new Error('restaurantId required for edit mode')
  }
  result = await updateRestaurant(restaurantId, data)  // No ! needed
}
```

### When to use `!`
- You're 100% certain the value exists
- TypeScript can't infer it from context
- Use sparingly - bypasses type safety

### When NOT to use `!`
- When you're not certain the value exists
- At system boundaries (user input, API responses, URL params)
- When a runtime check is easy to add

---

## 15. When to Reuse Types vs Keep Separate

### Reuse types when:
Same shape, same purpose:
```typescript
// RestaurantForm - reuses RestaurantInput for both form and initial data
interface RestaurantFormProps {
  mode: 'create' | 'edit'
  initialData?: RestaurantInput  // ✓ Same shape as form data
}
```

### Keep separate when:
Different shapes or purposes (form input vs database record):
```typescript
// ReviewInput (form data)
type ReviewInput = { rating: number; comment?: string }

// existingReview (database record) - has extra fields, different nullability
interface ReviewFormProps {
  existingReview?: {
    id: string              // Extra field for updates
    rating: number
    comment: string | null  // DB uses null, form uses undefined
  } | null
}
```

### Key differences that warrant separate types:
1. **Extra fields** - DB records have `id`, `createdAt`, etc.
2. **Nullability** - DB uses `null`, forms use `undefined`
3. **Optional vs required** - Different validation contexts

### Rule of thumb
- `FormInput` types = what user submits (validated by Zod)
- `DBRecord` types = what comes from database (often via Prisma)
- Don't force them together if they have different shapes

---

## 16. J2EE vs Next.js Type Layers

### J2EE layered architecture
| Layer | Purpose | Example |
|---|---|---|
| Entity/DAO | Database record | `RestaurantEntity` |
| DTO | Transfer between layers | `RestaurantDTO` |
| VO (View Object) | UI rendering | `RestaurantVO` |
| Form Bean | User input | `RestaurantForm` |

### Next.js simplified approach
| Purpose | Type Source |
|---|---|
| Database record | Prisma auto-generated (`Restaurant`) |
| Form input | Zod inferred (`RestaurantInput`) |
| Props | Interface in component file |

### Why Next.js is simpler
- Full-stack in one codebase (no remote boundaries)
- Server components can use Prisma types directly
- No serialization between EJB/SOAP layers

### When separation still matters
```typescript
// 1. Form input vs DB record (different shapes)
type ReviewInput = { rating: number; comment?: string }
type ReviewRecord = { id: string; rating: number; comment: string | null }

// 2. Server → Client serialization (Date → string)
type RestaurantServer = { createdAt: Date }      // Prisma
type RestaurantClient = { createdAt: string }    // After JSON.stringify

// 3. Public API (hide internal fields)
type RestaurantInternal = { id: string; ownerId: string; ... }
type RestaurantPublic = Omit<RestaurantInternal, 'ownerId'>
```

### Practical approach
```typescript
// Single source of truth: Zod schema
const restaurantSchema = z.object({ ... })
type RestaurantInput = z.infer<typeof restaurantSchema>

// Prisma generates DB types automatically
// Only create separate types when shapes actually differ
```

---

## 17. Type Narrowing with `in` Operator

### The pattern
Check if a property exists to narrow a union type:
```typescript
// Server action returns discriminated union
type ActionResult =
  | { error: string }
  | { success: true; data: Review }

// Narrow with 'in'
if ('error' in result) {
  setError('root', { message: result.error })  // TS knows: { error: string }
} else {
  reset()  // TS knows: { success: true; data: Review }
}
```

### Why `'error' in result` instead of `result.error`?
```typescript
// This may cause TS error if 'error' doesn't exist on all variants
if (result.error) { ... }

// This explicitly checks property existence - safer
if ('error' in result) { ... }
```

### Other type narrowing techniques
```typescript
// 1. typeof - for primitives
if (typeof value === 'string') { ... }

// 2. instanceof - for class instances
if (error instanceof Error) { ... }

// 3. Discriminant property - common pattern
type Result =
  | { status: 'success'; data: Data }
  | { status: 'error'; message: string }

if (result.status === 'success') {
  result.data  // TS knows this exists
}

// 4. Truthiness (less precise)
if (result.error) { ... }  // Works but less type-safe
```

### When to use each
| Technique | Use for |
|---|---|
| `'prop' in obj` | Checking optional properties on unions |
| `typeof` | Primitives (string, number, boolean) |
| `instanceof` | Class instances, Error types |
| Discriminant | When types share a common property with different values |

---

## 18. useRef Hook

### What is useRef?
A React hook that creates a **mutable reference** that persists across re-renders.
Unlike state, changing a ref does **NOT** trigger a re-render.

### Two main use cases

**1. Accessing DOM Elements** (most common)
```typescript
const inputRef = useRef<HTMLInputElement>(null)
```

**2. Storing Mutable Values** (like instance variables in a class)
```typescript
const timerIdRef = useRef<number | null>(null)
```

### Syntax breakdown
```typescript
const fileInputRef = useRef<HTMLInputElement>(null)
//    ^             ^      ^                  ^
//    |             |      |                  └── Initial value (null = element doesn't exist yet)
//    |             |      └── Generic type: what .current will hold
//    |             └── The hook
//    └── Variable name (convention: suffix with "Ref")
```

### The return type
```typescript
// useRef returns an object with a single property:
interface RefObject<T> {
  current: T | null
}

// So fileInputRef is:
{ current: null }  // initially
{ current: <HTMLInputElement> }  // after component mounts
```

### Connecting to DOM elements
```tsx
// 1. Create the ref
const fileInputRef = useRef<HTMLInputElement>(null)

// 2. Attach to element via ref prop
<input
  ref={fileInputRef}  // React sets fileInputRef.current = this element
  type="file"
/>

// 3. Access the element
fileInputRef.current?.click()  // Programmatically click the input
```

### Why initial value is `null`?
When component first runs, DOM element doesn't exist yet:
1. **Before render**: `fileInputRef.current` is `null`
2. **After render**: React sets `.current` to the actual DOM element
3. **On unmount**: React sets it back to `null`

### Why optional chaining (`?.`)?
```typescript
fileInputRef.current?.click()
```
Because `.current` could be `null` if:
- Element hasn't mounted yet
- Element was conditionally rendered and doesn't exist
- Component has unmounted

### Common DOM element ref types
```typescript
useRef<HTMLInputElement>(null)    // <input>
useRef<HTMLButtonElement>(null)   // <button>
useRef<HTMLDivElement>(null)      // <div>
useRef<HTMLFormElement>(null)     // <form>
useRef<HTMLTextAreaElement>(null) // <textarea>
useRef<HTMLCanvasElement>(null)   // <canvas>
```

### Common use cases
```typescript
// 1. Focus an input
inputRef.current?.focus()

// 2. Scroll to element
divRef.current?.scrollIntoView()

// 3. Trigger hidden file input (like in ImageUploader)
fileInputRef.current?.click()

// 4. Get input value (though controlled inputs preferred)
const value = inputRef.current?.value

// 5. Integrate with third-party libraries
const chart = new Chart(canvasRef.current)

// 6. Store previous value (no re-render needed)
const prevCountRef = useRef(count)
useEffect(() => {
  prevCountRef.current = count
})
```

### useRef vs useState
| | `useRef` | `useState` |
|---|---|---|
| **Re-renders** | No re-render on change | Re-renders on change |
| **Use for** | DOM refs, mutable values | UI state that affects rendering |
| **Persistence** | Survives re-renders | Survives re-renders |
| **Read during render** | Don't read/write `.current` during render | Safe to read during render |

### Key rules
1. **Don't read/write `.current` during render** - only in event handlers or effects
2. **Refs don't cause re-renders** - if you need UI updates, use state
3. **Type the ref generically** - `useRef<HTMLDivElement>(null)` for a div
4. **Initial value `null`** - for DOM refs (element doesn't exist until mount)

---

## 19. Google Material Symbols (Icon Font)

### What is it?
Google's icon font library that renders icons using text ligatures. You type the icon name as text, and the font displays the corresponding icon.

### How to use
```tsx
<span className="material-symbols-outlined">
  star
</span>
```
The text "star" renders as a ⭐ icon.

### Font Styles
Google provides three styles:

| Class Name | Style | Example |
|------------|-------|---------|
| `material-symbols-outlined` | Outlined (hollow) | ☆ |
| `material-symbols-rounded` | Rounded corners | ☆ (softer) |
| `material-symbols-sharp` | Sharp corners | ☆ (angular) |

### Variable Font Settings
Control icon appearance with `fontVariationSettings`:

```tsx
// Filled icon (solid)
<span
  className="material-symbols-outlined"
  style={{ fontVariationSettings: "'FILL' 1" }}
>
  star
</span>

// Outlined icon (default, no style needed)
<span className="material-symbols-outlined">
  star
</span>
```

### Font Variation Options
| Setting | Values | Description |
|---------|--------|-------------|
| `'FILL'` | 0 (default) or 1 | Outlined vs filled |
| `'wght'` | 100-700 | Weight (thin to bold) |
| `'GRAD'` | -25 to 200 | Grade (emphasis) |
| `'opsz'` | 20-48 | Optical size |

Example with multiple settings:
```tsx
style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
```

### Common Icons for Web Apps

**Navigation & Actions**
| Icon Name | Renders | Use Case |
|-----------|---------|----------|
| `menu` | ☰ | Hamburger menu |
| `close` | ✕ | Close/dismiss |
| `arrow_back` | ← | Back navigation |
| `arrow_forward` | → | Forward/next |
| `home` | 🏠 | Home page |
| `search` | 🔍 | Search |
| `settings` | ⚙️ | Settings |

**Content & Status**
| Icon Name | Renders | Use Case |
|-----------|---------|----------|
| `star` | ⭐ | Ratings, favorites |
| `star_half` | ½⭐ | Half ratings |
| `favorite` | ❤️ | Like/favorite |
| `check` | ✓ | Success, complete |
| `error` | ⚠️ | Error state |
| `info` | ℹ️ | Information |
| `warning` | ⚠️ | Warning |

**User & Account**
| Icon Name | Renders | Use Case |
|-----------|---------|----------|
| `person` | 👤 | User profile |
| `logout` | 🚪 | Sign out |
| `login` | → | Sign in |
| `account_circle` | 👤 | Account avatar |

**Content Actions**
| Icon Name | Renders | Use Case |
|-----------|---------|----------|
| `edit` | ✏️ | Edit content |
| `delete` | 🗑️ | Delete |
| `add` | + | Add new item |
| `remove` | - | Remove item |
| `share` | ↗️ | Share |
| `download` | ⬇️ | Download |
| `upload` | ⬆️ | Upload |

**Location & Maps**
| Icon Name | Renders | Use Case |
|-----------|---------|----------|
| `location_on` | 📍 | Location marker |
| `map` | 🗺️ | Map view |
| `directions` | ↗️ | Directions |

**E-commerce**
| Icon Name | Renders | Use Case |
|-----------|---------|----------|
| `shopping_cart` | 🛒 | Cart |
| `payments` | 💳 | Payment |
| `store` | 🏪 | Store |

### Setup (in Next.js)
Add to your `app/layout.tsx` or `_document.tsx`:
```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
/>
```

### Why Use Icon Fonts vs SVGs?
| Icon Fonts | SVGs |
|------------|------|
| ✓ Easy to use (just text) | ✓ More customizable |
| ✓ Inherits text color | ✓ No external dependency |
| ✓ Scales with font-size | ✓ Tree-shakeable |
| ✗ Requires font load | ✗ More verbose |
| ✗ Limited customization | ✗ Needs import per icon |

### Full Icon Reference
Browse all icons: https://fonts.google.com/icons

---

## 20. Conditional Classes: `cn` vs `clsx` vs `tailwind-merge`

### The `cn` utility (from this codebase)
```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### What Each Library Does

**clsx** - Conditionally joins classNames
```typescript
clsx('px-4', isActive && 'bg-blue-500', { 'font-bold': isBold })
// Output: "px-4 bg-blue-500 font-bold"
```

**tailwind-merge** - Resolves Tailwind conflicts (later wins)
```typescript
twMerge('px-2 px-4')
// Output: "px-4" (px-2 removed, px-4 wins)
```

**cn** - Combines both!
```typescript
cn('px-2', className)  // className = 'px-4'
// Output: "px-4" (conflict resolved)
```

### The Problem `cn` Solves

```typescript
// Without tailwind-merge (just clsx)
clsx('px-2 py-2', 'px-4')
// Output: "px-2 py-2 px-4" ❌ Both px-2 AND px-4 in output!

// With cn (clsx + tailwind-merge)
cn('px-2 py-2', 'px-4')
// Output: "py-2 px-4" ✓ px-4 overrides px-2
```

### Comparison Table

| Feature | `clsx` | `tailwind-merge` | `cn` (both) |
|---------|--------|------------------|-------------|
| Conditional classes | ✓ | ✗ | ✓ |
| Resolve Tailwind conflicts | ✗ | ✓ | ✓ |
| Array/object syntax | ✓ | ✗ | ✓ |
| Bundle size | ~1KB | ~3KB | ~4KB |

### Usage Patterns

```tsx
// 1. Simple concatenation
cn('base-class', 'another-class')

// 2. Conditional (falsy values ignored)
cn('px-4', isActive && 'bg-blue-500')
cn('px-4', isDisabled && 'opacity-50')

// 3. Object syntax
cn('px-4', {
  'bg-blue-500': isActive,
  'opacity-50': isDisabled
})

// 4. Override from props (main use case!)
cn('px-2 py-2 bg-gray-100', className)
// If className='px-4', result is 'py-2 bg-gray-100 px-4'
```

### Real Example from Button.tsx

```tsx
className={cn(
  baseStyles,           // 'inline-flex items-center...'
  variants[variant],    // 'bg-blue-600 text-white...'
  sizes[size],          // 'text-base px-4 py-2'
  className             // Custom override from parent
)}
```
If parent passes `className="px-8"`, it **overrides** `px-4` instead of conflicting.

### Real Example from Input.tsx

```tsx
className={cn(
  'w-full px-3 py-2 border rounded-md...',  // Base
  error ? 'border-red-500' : 'border-gray-300',  // Conditional
  props.disabled && 'bg-gray-100 cursor-not-allowed',  // Conditional
  className  // Override
)}
```

### When to Use What

| Situation | Use |
|-----------|-----|
| No Tailwind, just conditional classes | `clsx` |
| Tailwind with prop overrides | `cn` |
| Simple static classes | Neither (just string) |

### Why This Matters for Reusable Components

```tsx
// Component with base styles
<Button className="px-8">Wide Button</Button>

// Without cn: "px-4 px-8" - unpredictable!
// With cn: "px-8" - parent override wins ✓
```

---

## 21. Server Components vs Client Components

### The Fundamental Difference

**Server Components** (default in Next.js 13+):
- Render on the server
- Can directly access databases, file systems, secrets
- Cannot use hooks (useState, useEffect, etc.)
- Cannot use browser APIs (window, document)
- Can be `async` functions

**Client Components**:
- Render in the browser (after hydration)
- Can use React hooks and browser APIs
- Must add `'use client'` directive at top of file
- Cannot directly use server-only features

### How to Identify

```tsx
// SERVER COMPONENT (default - no directive)
export async function Navigation() {  // ← async is allowed!
  const user = await getCurrentUser()  // ← Direct server call
  return <nav>...</nav>
}

// CLIENT COMPONENT (has directive)
'use client'

export function Counter() {
  const [count, setCount] = useState(0)  // ← Hooks allowed
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### Key Pattern: Server Component with Direct Data Fetch

```tsx
// Navigation.tsx - Server Component
export async function Navigation() {
  const user = await getCurrentUser()  // Called on server, not client!

  return (
    <nav>
      {user ? (
        <>
          <span>Welcome, {user.name}</span>
          {user.role === 'OWNER' ? (
            <Link href="/owner/my-restaurants">My Restaurants</Link>
          ) : (
            <Link href="/">Browse</Link>
          )}
          <LogoutButton />
        </>
      ) : (
        <>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Register</Link>
        </>
      )}
    </nav>
  )
}
```

### Benefits of Server Components

1. **No Loading States for Initial Data**
   - Data is fetched before HTML is sent
   - User sees complete content immediately

2. **Smaller JavaScript Bundle**
   - Server-only code not sent to client
   - Libraries like Prisma stay server-side

3. **Direct Database Access**
   - No API layer needed for simple reads
   - Call Prisma/database directly in component

4. **Security**
   - Server-only code can use secrets
   - Database queries never exposed to client

### Root Layout Pattern

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Global fonts, meta tags */}
      </head>
      <body>
        <Navigation />   {/* Persistent across all pages */}
        {children}       {/* Page content changes here */}
        <footer>...</footer>
      </body>
    </html>
  )
}
```

### What is `children: React.ReactNode`?

- **`children`**: Special prop that contains nested content
- **`React.ReactNode`**: The broadest type for renderable content

```tsx
// ReactNode can be:
type ReactNode =
  | ReactElement     // <Component />
  | string           // "text"
  | number           // 42
  | null             // renders nothing
  | undefined        // renders nothing
  | boolean          // renders nothing
  | ReactNode[]      // Array of any above
```

### Layout Hierarchy

```
app/
├── layout.tsx          ← Root layout (wraps everything)
├── page.tsx            ← Home page
├── login/
│   └── page.tsx        ← Login page
└── owner/
    ├── layout.tsx      ← Owner section layout (nested)
    └── my-restaurants/
        └── page.tsx    ← My restaurants page
```

Nested layouts wrap their children:
```
Root Layout
└── Navigation
└── {children}
    └── Owner Layout (if in /owner/* route)
        └── {children}
            └── Page content
```

### When to Use Each

| Use Server Component When | Use Client Component When |
|---------------------------|---------------------------|
| Fetching data | Using useState, useEffect, etc. |
| Accessing backend resources | Handling user interactions (onClick) |
| Keeping sensitive info server-side | Using browser APIs (localStorage) |
| Rendering static or async content | Real-time updates (WebSocket) |

### Common Mistake

```tsx
// ❌ WRONG: Trying to use hooks in Server Component
export async function Navigation() {
  const [isOpen, setIsOpen] = useState(false)  // Error!
  // ...
}

// ✓ CORRECT: Extract client parts to separate component
// Navigation.tsx (Server)
export async function Navigation() {
  const user = await getCurrentUser()
  return (
    <nav>
      <MobileMenu />  {/* Client component for interactivity */}
      {/* ... */}
    </nav>
  )
}

// MobileMenu.tsx (Client)
'use client'
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  return <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
}
```

### The Pattern Summary

1. **Default to Server Components** - for data fetching, static content
2. **Add `'use client'` only when needed** - for interactivity, hooks
3. **Keep client components small** - push interactivity to leaf components
4. **Compose them together** - Server component can render Client components

---

## 22. TypeScript Utility Types

### `Omit<T, K>` - Remove Keys from Type

Creates a new type by removing specified keys from an existing type:

```tsx
// Original type (from z.infer)
type JWTPayload = {
  userId: string
  email: string
  role: 'REVIEWER' | 'OWNER'
  iat?: number
  exp?: number
}

// Remove iat and exp
type AuthPayload = Omit<JWTPayload, 'iat' | 'exp'>
// Result: { userId: string; email: string; role: 'REVIEWER' | 'OWNER' }
```

### Common Utility Types

| Utility | What it does | Example |
|---------|--------------|---------|
| `Omit<T, K>` | Remove keys | `Omit<User, 'password'>` |
| `Pick<T, K>` | Keep only specified keys | `Pick<User, 'id' \| 'name'>` |
| `Partial<T>` | Make all keys optional | `Partial<User>` |
| `Required<T>` | Make all keys required | `Required<User>` |
| `Readonly<T>` | Make all keys readonly | `Readonly<User>` |

### Real-World Examples

```tsx
// 1. Hide sensitive fields for public API
type PublicUser = Omit<User, 'password' | 'email'>

// 2. Form input (exclude auto-generated fields)
type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>

// 3. Partial update (all fields optional, except id)
type UpdateUserInput = Partial<Omit<User, 'id'>>

// 4. Display subset of fields
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>

// 5. Derive from Zod schema
type AuthPayload = Omit<z.infer<typeof jwtPayloadSchema>, 'iat' | 'exp'>
```

### `Pick` vs `Omit`

```tsx
type User = { id: string; name: string; email: string; password: string }

// Pick: "I want ONLY these"
type UserName = Pick<User, 'name'>
// { name: string }

// Omit: "I want EVERYTHING EXCEPT these"
type SafeUser = Omit<User, 'password'>
// { id: string; name: string; email: string }
```

### Combining Utility Types

```tsx
// Partial + Omit: Optional update (without changing id)
type UpdateInput = Partial<Omit<User, 'id'>>
// { name?: string; email?: string; password?: string }

// Pick + Required: Ensure specific fields are present
type RequiredFields = Required<Pick<User, 'email' | 'password'>>
// { email: string; password: string }

// Readonly + Pick: Immutable subset
type UserDisplay = Readonly<Pick<User, 'id' | 'name'>>
// { readonly id: string; readonly name: string }
```

### When to Use Each

| Scenario | Utility | Example |
|----------|---------|---------|
| Remove sensitive fields | `Omit` | `Omit<User, 'password'>` |
| Create input type (no id/timestamps) | `Omit` | `Omit<Entity, 'id' \| 'createdAt'>` |
| Select specific fields | `Pick` | `Pick<User, 'id' \| 'name'>` |
| Optional update payload | `Partial` | `Partial<User>` |
| Ensure all fields present | `Required` | `Required<Config>` |
| Prevent mutation | `Readonly` | `Readonly<State>` |
