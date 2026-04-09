import Axios, { AxiosRequestConfig } from 'axios';
// Import your existing custom axios instance!
import { api } from './api';

// This bridge tells Orval to use YOUR axios instance (which has your auth tokens)
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = api({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // Allow React Query to cancel requests if the component unmounts
  // @ts-expect-error - Axios doesn't have a built-in cancel method on the promise, so we add it manually
  promise.cancel = () => {
    source.cancel('Query was cancelled by React Query');
  };

  return promise;
};
