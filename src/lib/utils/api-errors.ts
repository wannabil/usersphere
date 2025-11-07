/**
 * API Error parsing utilities
 */

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string | string[]>;
  error?: string;
}

/**
 * Parse API error response and extract field-level errors
 */
export function parseApiError(error: any): {
  message: string;
  fieldErrors: FieldError[];
} {
  const response = error?.response?.data as ApiErrorResponse | undefined;
  
  // Default message
  let message = 'An unexpected error occurred';
  const fieldErrors: FieldError[] = [];

  if (!response) {
    return { message, fieldErrors };
  }

  // Extract main message
  if (response.message) {
    message = response.message;
  } else if (response.error) {
    message = response.error;
  }

  // Extract field-level errors
  if (response.errors && typeof response.errors === 'object') {
    Object.entries(response.errors).forEach(([field, fieldMessage]) => {
      const errorMessage = Array.isArray(fieldMessage) 
        ? fieldMessage[0] 
        : fieldMessage;
      
      fieldErrors.push({
        field: field.toLowerCase(),
        message: errorMessage,
      });
    });
  }

  return { message, fieldErrors };
}

/**
 * Convert field errors to React Hook Form format
 */
export function fieldErrorsToFormErrors(fieldErrors: FieldError[]): Record<string, { message: string }> {
  const formErrors: Record<string, { message: string }> = {};
  
  fieldErrors.forEach(({ field, message }) => {
    formErrors[field] = { message };
  });
  
  return formErrors;
}

