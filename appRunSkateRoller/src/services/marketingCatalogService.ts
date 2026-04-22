import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';
import {API_ENDPOINTS} from '../config/api';
import {migrateOrphanSalesToAlexAzcapo} from './marketingSalesMigration';
import {MARKETING_SALES_KEY} from '../config/marketingStorage';

export type MarketingCatalogItem = {
  id: string;
  brandModel: string;
  priceMx?: string;
  category?: string;
  photoUri?: string | null;
  /** Varias fotos (hasta 5 al publicar); la primera se repite en photoUri para compatibilidad */
  photoUris?: string[] | null;
  createdAt?: string;
  homeDelivery?: boolean;
  deliveryFeeMx?: number;
  ownerUserId?: string;
  saleType?: string;
  listingFeeMx?: number;
};

export async function tryFetchMarketingSalesFromApi(): Promise<
  MarketingCatalogItem[] | null
> {
  try {
    const res = await apiService.get<{
      success?: boolean;
      sales?: MarketingCatalogItem[];
    }>(API_ENDPOINTS.MARKETING.SALES);
    if (Array.isArray(res?.sales)) {
      return res.sales;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lista unificada: si el backend responde, es la fuente de verdad para todos los dispositivos.
 * Si no hay API (offline o mock sin servidor), se usa AsyncStorage local + migración huérfanos.
 */
export async function loadMarketingSalesCatalog(): Promise<MarketingCatalogItem[]> {
  const remote = await tryFetchMarketingSalesFromApi();
  if (remote !== null) {
    await AsyncStorage.setItem(MARKETING_SALES_KEY, JSON.stringify(remote));
    return remote;
  }
  await migrateOrphanSalesToAlexAzcapo();
  try {
    const raw = await AsyncStorage.getItem(MARKETING_SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export type CreateMarketingSalePayload = {
  brandModel: string;
  priceMx?: string;
  category?: string;
  photoUri?: string | null;
  photoUris?: string[];
  homeDelivery?: boolean;
  deliveryFeeMx?: number;
  saleType?: string;
  listingFeeMx?: number;
};

export async function createMarketingSaleRemote(
  payload: CreateMarketingSalePayload,
): Promise<boolean> {
  try {
    await apiService.post(API_ENDPOINTS.MARKETING.SALES, {
      brandModel: payload.brandModel,
      priceMx: payload.priceMx,
      category: payload.category,
      photoUri: payload.photoUri,
      photoUris: payload.photoUris,
      homeDelivery: payload.homeDelivery,
      deliveryFeeMx: payload.deliveryFeeMx,
      saleType: payload.saleType,
      listingFeeMx: payload.listingFeeMx,
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteMarketingSaleRemote(id: string): Promise<boolean> {
  try {
    await apiService.delete(API_ENDPOINTS.MARKETING.SALE_BY_ID(id));
    return true;
  } catch {
    return false;
  }
}

export async function updateMarketingSaleRemote(
  id: string,
  body: {brandModel?: string; priceMx?: string; category?: string},
): Promise<boolean> {
  try {
    await apiService.put(API_ENDPOINTS.MARKETING.SALE_BY_ID(id), body);
    return true;
  } catch {
    return false;
  }
}
