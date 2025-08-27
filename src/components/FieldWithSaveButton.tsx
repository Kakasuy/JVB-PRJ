import { Field, Label } from '@/shared/fieldset'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface FieldWithSaveButtonProps {
  label: string
  children: React.ReactNode
  isModified: boolean
  isUpdating: boolean
  hasError: boolean
  hasSuccess: boolean
  errorMessage?: string
  onSave: () => void
}

export default function FieldWithSaveButton({
  label,
  children,
  isModified,
  isUpdating,
  hasError,
  hasSuccess,
  errorMessage,
  onSave
}: FieldWithSaveButtonProps) {
  return (
    <Field>
      <Label>{label}</Label>
      <div className="mt-1.5 space-y-2">
        <div className="relative">
          {children}
          
          {/* Status indicators */}
          {hasSuccess && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <CheckIcon className="h-5 w-5 text-green-500" />
            </div>
          )}
          
          {hasError && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <XMarkIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        
        {/* Save button - only show when field is modified */}
        {isModified && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <button
              onClick={onSave}
              disabled={isUpdating}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
                isUpdating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              )}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
            
            <span className="text-sm text-blue-700">
              You have unsaved changes. Click "Save Changes" to update.
            </span>
          </div>
        )}
        
        {/* Error message */}
        {hasError && errorMessage && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            {errorMessage}
          </div>
        )}
        
        {/* Success message */}
        {hasSuccess && (
          <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
            Updated successfully!
          </div>
        )}
      </div>
    </Field>
  )
}