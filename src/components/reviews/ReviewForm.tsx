'use client';

import { useTransition } from 'react';
import { createReview, updateReview } from '@/app/actions/reviews';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewSchema, type ReviewInput } from '@/lib/validators';
import { ErrorMessage } from '@/components/ui';

interface ReviewFormProps {
  restaurantId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export default function ReviewForm({ restaurantId, existingReview }: ReviewFormProps) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, setError, reset} = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
     mode: 'onBlur',
     reValidateMode: 'onChange',
     defaultValues: {
      rating: existingReview?.rating ?? 5,
      comment: existingReview?.comment ?? '',
    },
  });

  const onSubmit = (data: ReviewInput) => {

    startTransition(async () => {
      let result;

      if (existingReview) {
        result = await updateReview(
          existingReview.id,
          data.rating,
          data.comment
        );
      } else {
        result = await createReview(
          restaurantId,
          data.rating,
          data.comment
        );
      }

      if (!result.success) {
         setError('root', { message: result.error })
      } else {
        reset();
      }
    });
  };

  return (
    <div className="shadow-md px-4 py-6 rounded-lg space-y-3">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {errors.root?.message && <ErrorMessage message={errors.root.message} />}

        <div>
          <label className="text-gray-800 text-sm font-semibold" htmlFor="comment">
            {existingReview ? 'Update your review' : 'Have you been here? How did you find it?'}
          </label>
          <textarea
            id="comment"
            {...register('comment', {
                       setValueAs: (v) => v?.trim() || undefined
             })}
            disabled={isPending}
            className="w-full rounded-lg border-0 shadow-sm p-2 h-36 resize-none ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            placeholder="Write your review..."
          />
           {errors.comment && (
             <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
           )}
        </div>

        <div>
          <label className="text-gray-800 text-sm font-semibold" htmlFor="rating">
            Rating
          </label>
          <select
            className="w-20 border-gray-300 border rounded-md p-1"
            id="rating"
            {...register('rating',  { valueAsNumber: true })}
            disabled={isPending}
          >
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
           { errors.rating && (
             <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
           )}
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white disabled:opacity-50"
          >
            {isPending
              ? (existingReview ? 'Updating...' : 'Submitting...')
              : (existingReview ? 'Update review' : 'Submit review')
            }
          </button>
        </div>
      </form>
    </div>
  );
}
