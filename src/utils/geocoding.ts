// Función para obtener la dirección a partir de coordenadas
export async function getAddressFromCoordinates(lat: number, lng: number) {
  try {
    console.log('Fetching address for coordinates:', { lat, lng });
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GrupoSM-CRM/1.0'
        },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Nominatim response:', data);
    
    if (!data || !data.address) {
      return {
        address: data.display_name || 'Dirección no encontrada',
        population: 'Ubicación desconocida'
      };
    }

    // Construir la dirección desde los componentes específicos
    const street = data.address.road || data.address.street || data.address.pedestrian || data.address.footway;
    const number = data.address.house_number;
    const suburb = data.address.suburb || data.address.neighbourhood;
    const city = data.address.city || data.address.town || data.address.village;

    // Construir la dirección completa
    const addressParts = [];
    if (street) {
      addressParts.push(street);
      if (number) {
        addressParts[addressParts.length - 1] += `, ${number}`;
      }
    }
    if (suburb) addressParts.push(suburb);
    if (city) addressParts.push(city);

    const address = addressParts.join(', ');

    return {
      address: address || data.display_name || 'Dirección no encontrada',
      population: city || 'Ubicación desconocida'
    };

  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    // Intentar con una API alternativa si la primera falla
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          address: data.locality || data.city || 'Dirección no encontrada',
          population: data.city || data.countryName || 'Ubicación desconocida'
        };
      }
    } catch (secondError) {
      console.error('Error with alternative API:', secondError);
    }

    return {
      address: 'Dirección no encontrada',
      population: 'Ubicación desconocida'
    };
  }
}

// interface NominatimResult {
//   lat: string;
//   lon: string;
//   display_name: string;
//   address?: {
//     city?: string;
//     town?: string;
//     village?: string;
//   };
// }

// Función para obtener coordenadas a partir de una dirección
export async function getCoordinatesFromAddress(address: string) {
  try {
    // Limpiar y formatear la dirección para mejorar los resultados
    const cleanAddress = address.trim().replace(/\s+/g, ' ');
    console.log('Searching coordinates for address:', cleanAddress);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&limit=1&accept-language=es`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GrupoSM-CRM/1.0'
        },
        mode: 'cors',
        credentials: 'omit'
      }
    );

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (!data || data.length === 0) {
      console.log('No coordinates found for address');
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error('Error getting coordinates from address:', error);
    return null;
  }
} 