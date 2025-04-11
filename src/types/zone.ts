

export interface Zone {
  id: string;
  name: string;
  description: string | null;
  color: string;
  coordinates: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  createdAt: Date;
  updatedAt: Date;
} 