/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosRequestConfig } from 'axios';

// Extend AxiosInstance to have generic methods that return typed responses.
// More info: https://github.com/axios/axios/issues/1510#issuecomment-525382535

declare module 'axios' {
  export interface AxiosInstance {
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<T>;
    post<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<T>;
    put<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<T>;
    request<T = any>(config: AxiosRequestConfig): Promise<T>;
  }
}
