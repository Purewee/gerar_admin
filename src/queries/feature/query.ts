import adminFetchAndValidate from '@/lib/admin-fetcher';
import type {
  CreateFeatureRequest,
  UpdateFeatureRequest,
  FeaturesResponse,
  Feature,
} from './type';
import { FeatureResponseSchema, FeaturesResponseSchema } from './type';

export const getFeatures = async (): Promise<Feature[]> => {
  const response = await adminFetchAndValidate<FeaturesResponse>(
    '/admin/features',
    FeaturesResponseSchema,
  );
  return response.data;
};

export const getFeature = async (id: number): Promise<Feature> => {
  const response = await adminFetchAndValidate<{ success: boolean; message: string; data: Feature }>(
    `/admin/features/${id}`,
    FeatureResponseSchema,
  );
  return response.data;
};

export const createFeature = async (feature: CreateFeatureRequest): Promise<Feature> => {
  const response = await adminFetchAndValidate<{ success: boolean; message: string; data: Feature }>(
    '/admin/features',
    FeatureResponseSchema,
    { method: 'POST', body: feature },
  );
  return response.data;
};

export const updateFeature = async (
  id: number,
  updates: UpdateFeatureRequest,
): Promise<Feature> => {
  const response = await adminFetchAndValidate<{ success: boolean; message: string; data: Feature }>(
    `/admin/features/${id}/update`,
    FeatureResponseSchema,
    { method: 'POST', body: updates },
  );
  return response.data;
};

export const deleteFeature = async (id: number): Promise<Feature> => {
  const response = await adminFetchAndValidate<{ success: boolean; message: string; data: Feature }>(
    `/admin/features/${id}/delete`,
    FeatureResponseSchema,
    { method: 'POST' },
  );
  return response.data;
}
