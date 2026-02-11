import adminFetchAndValidate from '@/lib/admin-fetcher';
import type {
  CreateBannerRequest,
  UpdateBannerRequest,
  BannersResponse,
  Banner,
} from './type';
import { BannerResponseSchema, BannersResponseSchema } from './type';

export const getBanners = async (): Promise<Banner[]> => {
  const response = await adminFetchAndValidate<BannersResponse>(
    '/admin/banners',
    BannersResponseSchema,
  );
  return response.data;
};

export const getBanner = async (id: number): Promise<Banner> => {
  const response = await adminFetchAndValidate<{ success: boolean; message: string; data: Banner }>(
    `/admin/banners/${id}`,
    BannerResponseSchema,
  );
  return response.data;
};

export const createBanner = async (banner: CreateBannerRequest): Promise<Banner> => {
  const response = await adminFetchAndValidate<{ success: boolean; message: string; data: Banner }>(
    '/admin/banners',
    BannerResponseSchema,
    { method: 'POST', body: banner },
  );
  return response.data;
};

export const updateBanner = async (
  id: number,
  updates: UpdateBannerRequest,
): Promise<Banner> => {
  const response = await adminFetchAndValidate<{ success: boolean; message: string; data: Banner }>(
    `/admin/banners/${id}/update`,
    BannerResponseSchema,
    { method: 'POST', body: updates },
  );
  return response.data;
};

export const deleteBanner = async (id: number): Promise<Banner> => {
  const response = await adminFetchAndValidate<{ success: boolean; message: string; data: Banner }>(
    `/admin/banners/${id}/delete`,
    BannerResponseSchema,
    { method: 'POST' },
  );
  return response.data;
}
