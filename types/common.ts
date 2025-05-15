export type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
    metadata?: {
        total: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        page: number;
        lastPage: number;
    }
}

export type PaginationParams = {
    page?: number;
    limit?: number;
  };
  
  
export type QueryParams = PaginationParams & {
    take?: number;
    skip?: number;
    where?: Record<string, string | number | boolean | object | null>;
    include?: Record<string, string | number | boolean | object | null>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    limitFields?: string[];
    status?: string[];
  }