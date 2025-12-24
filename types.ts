
export type CarType = 'Sedán' | 'SUV' | 'Troca';
export type FuelType = 'Gasolina' | 'Diésel' | 'Eléctrico' | 'Híbrido';
export type StatusType = 'Disponible' | 'Vendido' | 'Reservado';
export type TransmissionType = 'Automática' | 'Manual';
export type LocationType = 'Houston' | 'Dallas';

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  engine: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  type: CarType;
  location: LocationType;
  enganche: number;
  description: string;
  imageUrls: string[]; // Actualizado a arreglo para carrusel
  features: string[];
  status: StatusType;
}

export type ViewType = 'grid' | 'manage' | 'details';
