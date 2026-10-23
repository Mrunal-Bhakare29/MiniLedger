import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the MiniLedger server. Start the backend and check the API URL.';
    }
    const data = error.response.data as { error?: string; details?: { message?: string }[] };
    if (data?.details?.[0]?.message) {
      return data.details[0].message;
    }
    if (data?.error) {
      return data.error;
    }
    return `Request failed (${error.response.status})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
