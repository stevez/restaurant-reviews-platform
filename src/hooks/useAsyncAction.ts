import { type ActionResult } from "@/types/actions";
import { useState, useTransition } from "react";

interface ExecuteOptions<TData> {
    onSuccess?: (data: TData) => void
    onError?: (error: string) => void
}

export function useAsyncAction<TData, TArgs extends any[]>(
    action: (...args: TArgs) => Promise<ActionResult<TData>>
) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<TData | null>(null)

    const execute = (options?: ExecuteOptions<TData>) => (...args: TArgs): void => {
        startTransition(async () => {
            setError(null)
            const result = await action(...args)
            if (result.success) {
                if ('data' in result) {
                    setData(result.data)
                    options?.onSuccess?.(result.data)
                } else {
                    options?.onSuccess?.(undefined as TData)
                }
            } else {
                setError(result.error)
                options?.onError?.(result.error)
            }
        })
    }

    const reset = () => {
        setError(null)
        setData(null)
    }

    return {
        error,
        setError,
        isPending,
        execute,
        data,
        reset,
    }
}