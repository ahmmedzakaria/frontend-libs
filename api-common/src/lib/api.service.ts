import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActionTypes } from './model/action-types';
import { Environment } from './environment';
import { ApiEndpoint } from './model/endpoint';


@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = Environment.apiBaseUrl;
    private loginUrl = Environment.loginUrl;

    public getToken() {
        return localStorage.getItem('token');
    }

    constructor(private http: HttpClient) {}

    /**
     * Build headers (Auth + JSON/multipart)
     */
    private buildHeaders(isMultiPart: boolean = false): HttpHeaders {
        const token = this.getToken();
        let headers = new HttpHeaders();

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        if (!isMultiPart) {
            headers = headers.set('Content-Type', 'application/json');
        }

        return headers;
    }

    /**
     * Generalized POST for all actions (create, update, delete, search, login)
     */
    post<T>(
        apiInfo: ApiEndpoint,
        body: any = {},
        options: {
            headers?: HttpHeaders;
            responseType?: 'json' | 'arraybuffer';
            observe?: 'body' | 'response';
        } = {}
    ): Observable<T> {
        if (body instanceof FormData) {
            if (!body.has('source')) {
                body.append('source', 'NEXACORE_APP');
            }
        } else {
            body.source = "NEXACORE_APP";
        }

        const basePath = [ActionTypes.LOGIN, ActionTypes.AUTH].includes(apiInfo.actionType)
            ? this.loginUrl
            : this.baseUrl;

        const headers = options.headers || this.buildHeaders(apiInfo.isMultiPart);
        const requestOptions = {
            ...options,
            headers,
        } as any;

        return this.http.post(`${basePath}/${apiInfo.apiPath}`, body, requestOptions).pipe(
            catchError(this.handleError)
        ) as Observable<T>;
    }

    fetchBinaryData(
        apiInfo: ApiEndpoint,
        body: any = {},
        options: {
            headers?: HttpHeaders;
            responseType?: 'arraybuffer';
            observe?: 'response';
        } = { responseType: 'arraybuffer', observe: 'response' }
    ): Observable<{ blob: Blob; filename: string; contentType: string | null }> {
        if (!apiInfo) {
            return throwError(() => new Error('Api information is missing'));
        }

        if (body instanceof FormData) {
            if (!body.has('source')) {
                body.append('source', 'NEXACORE_APP');
            }
        } else {
            body.source = 'NEXACORE_APP';
        }

        const requestOptions = {
            ...options,
            responseType: 'arraybuffer' as const,
            observe: 'response' as const,
        };

        return this.post<HttpResponse<ArrayBuffer>>(apiInfo, body, requestOptions).pipe(
            map((response: HttpResponse<ArrayBuffer>) => {
                const contentType = response.headers.get('Content-Type');
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'download';

                if (contentDisposition) {
                    const match = contentDisposition.match(/filename\*?=(?:UTF-8''|\"?)([^\";]+)/i);
                    if (match?.[1]) {
                        filename = decodeURIComponent(match[1].replace(/\"/g, ''));
                    }
                }

                const blob = new Blob([response.body ?? new ArrayBuffer(0)], {
                    type: contentType || 'application/octet-stream',
                });

                return { blob, filename, contentType };
            }),
            catchError(this.handleError)
        );
    }

    fetchImageUrl(
        apiInfo: ApiEndpoint,
        body: any = {}
    ): Observable<string> {
        return this.fetchBinaryData(apiInfo, body).pipe(
            map(({ blob }) => URL.createObjectURL(blob))
        );
    }

    /**
     * Error handler
     */
    private handleError(error: HttpErrorResponse) {
        console.error('API Error:', error);
        let errorMsg = 'An unknown error occurred';
        if (error.error instanceof ErrorEvent) {
            errorMsg = `Client error: ${error.error.message}`;
        } else {
            errorMsg = `Server error (${error.status}): ${error.message}`;
        }
        return throwError(() => new Error(errorMsg));
    }
}
