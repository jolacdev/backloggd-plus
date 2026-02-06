import axios, { AxiosResponse } from 'axios';

// NOTE: Body response from API on error. Seem to not be defined, but we keep it as it is a widely adopted standard.
type ApiDataError = {
  message?: string;
};

type ErrorResponse = {
  message: string;
  status: number;
  url?: string;
};

const API_BASE_URL = 'https://backloggd.com';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';
const UNKNOWN_ERROR_STATUS = 400;

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiDataError>(error)) {
    const apiResponseMessage = error.response?.data?.message;
    return apiResponseMessage || error.message || UNKNOWN_ERROR_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message || UNKNOWN_ERROR_MESSAGE;
  }

  return UNKNOWN_ERROR_MESSAGE;
};

const getErrorStatus = (error: unknown): number => {
  if (!axios.isAxiosError(error)) {
    return UNKNOWN_ERROR_STATUS;
  }

  return error.response?.status || error.status || UNKNOWN_ERROR_STATUS;
};

const onResponseFulfilled = <T>(response: AxiosResponse<T>) => response.data;

const onResponseRejected = (error: unknown) => {
  const errorResponse: ErrorResponse = {
    message: getErrorMessage(error),
    status: getErrorStatus(error),
    url: axios.isAxiosError(error) ? error.config?.url : undefined,
  };

  console.error('API request failed:', errorResponse);
  return Promise.reject(errorResponse);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json, text/html',
  },
});

api.interceptors.response.use(onResponseFulfilled, onResponseRejected);
