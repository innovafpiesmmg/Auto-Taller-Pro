import type { IStorage } from "../storage";

const CARAPI_BASE_URL = "https://carapi.app/api";

interface CarAPIConfig {
  token: string | null;
  secret: string | null;
}

interface JWTResponse {
  token: string;
}

interface CarAPIMake {
  id: number;
  name: string;
}

interface CarAPIModel {
  id: number;
  name: string;
  make_id: number;
  make_model_id: string;
}

interface CarAPIYear {
  id: number;
  year: number;
}

interface CarAPIVINResponse {
  id: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: {
    engine_type?: string;
    cylinders?: number;
    displacement?: string;
    horsepower?: number;
  };
  transmission?: {
    transmission_type?: string;
  };
  drive_type?: string;
  fuel_type?: string;
  city_mileage?: string;
  highway_mileage?: string;
}

export class CarAPIService {
  private storage: IStorage;
  private jwtToken: string | null = null;
  private jwtExpiry: number = 0;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  private async getConfig(): Promise<CarAPIConfig> {
    const tokenConfig = await this.storage.getConfigSistema("CARAPI_TOKEN");
    const secretConfig = await this.storage.getConfigSistema("CARAPI_SECRET");
    
    return {
      token: tokenConfig?.valor || null,
      secret: secretConfig?.valor || null,
    };
  }

  private async ensureJWT(): Promise<string | null> {
    const config = await this.getConfig();
    
    // Si no hay credenciales, usar modo gratuito (sin JWT)
    if (!config.token || !config.secret) {
      return null;
    }

    // Si el JWT está válido, devolverlo
    const now = Date.now();
    if (this.jwtToken && this.jwtExpiry > now) {
      return this.jwtToken;
    }

    // Obtener nuevo JWT
    try {
      const response = await fetch(`${CARAPI_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          api_token: config.token,
          api_secret: config.secret,
        }),
      });

      if (!response.ok) {
        console.error('CarAPI auth failed:', await response.text());
        return null;
      }

      const data: JWTResponse = await response.json();
      this.jwtToken = data.token;
      
      // JWT válido por 7 días, refrescar 1 hora antes
      this.jwtExpiry = now + (7 * 24 * 60 * 60 * 1000) - (60 * 60 * 1000);
      
      return this.jwtToken;
    } catch (error) {
      console.error('CarAPI auth error:', error);
      return null;
    }
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const jwt = await this.ensureJWT();
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }

    const response = await fetch(`${CARAPI_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CarAPI error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async getMakes(year?: number): Promise<CarAPIMake[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    
    const endpoint = `/makes${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.apiRequest<{ data: CarAPIMake[] }>(endpoint);
    return response.data || [];
  }

  async getModels(makeId?: number, year?: number): Promise<CarAPIModel[]> {
    const params = new URLSearchParams();
    if (makeId) params.append('make_id', makeId.toString());
    if (year) params.append('year', year.toString());
    
    const endpoint = `/models${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.apiRequest<{ data: CarAPIModel[] }>(endpoint);
    return response.data || [];
  }

  async getYears(): Promise<CarAPIYear[]> {
    const response = await this.apiRequest<{ data: CarAPIYear[] }>('/years');
    return response.data || [];
  }

  async decodeVIN(vin: string): Promise<CarAPIVINResponse | null> {
    try {
      const response = await this.apiRequest<CarAPIVINResponse>(`/vin/${vin}`);
      return response;
    } catch (error) {
      console.error('VIN decode error:', error);
      return null;
    }
  }

  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(config.token && config.secret);
  }
}
