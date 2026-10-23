import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('trendora_token') : null;

  let headers = req.headers;

  // If bearer token exists in localStorage, attach Authorization header
  if (token && !req.headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const modifiedReq = req.clone({
    headers,
    withCredentials: true
  });

  return next(modifiedReq);
};
