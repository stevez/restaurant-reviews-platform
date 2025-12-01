import { renderHook, act, waitFor, render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useAsyncAction } from '../useAsyncAction'
import { type ActionResult } from '@/types/actions'

describe('useAsyncAction', () => {
  it('should have correct initial state', () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAsyncAction(action))
    
    expect(result.current.error).toBe(null)
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBe(null)
  })

  it('should handle successful action with data', async () => {
    const action = vi.fn().mockResolvedValue({success: true, data: {id: 123}})
    const { result } = renderHook(() => useAsyncAction(action))
    const onSuccess = vi.fn()

    act(() => result.current.execute({onSuccess})())
    await waitFor(() => {
       expect(result.current.data).toEqual({id: 123})
       expect(onSuccess).toHaveBeenCalledWith({id: 123})
    })
  })

  it('should handle successful action without data', async() => {
    const action = vi.fn().mockResolvedValue({success: true})
    const {result} = renderHook(() => useAsyncAction(action))
    const onSuccess = vi.fn()
    act(() => {
      result.current.execute({onSuccess})()
    })
    await waitFor(() => {
      expect(result.current.data).toEqual(null)
      expect(onSuccess).toHaveBeenCalledWith(undefined)
    })
  })

  it('should handle failed action', async() => {
     const action = vi.fn().mockResolvedValue({success: false, error: 'some error' })
     const { result } = renderHook(() => useAsyncAction(action))
     const onSuccess = vi.fn()
     const onError = vi.fn()
     act(() => result.current.execute({onSuccess, onError})())

     await waitFor(() => {
      expect(result.current.data).toEqual(null)
      expect(result.current.error).toBe('some error')  
      expect(onError).toHaveBeenCalledWith('some error')
      expect(onSuccess).not.toHaveBeenCalled()
     })
  })

  it('should reset state', async () => {
      const action = vi.fn().mockResolvedValue({ success: true, data: { id: 123 } })
      const { result } = renderHook(() => useAsyncAction(action))

      act(() => result.current.execute()())
      await waitFor(() => expect(result.current.data).toEqual({ id: 123 }))

      act(() => result.current.reset())
      
      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)
  })

})