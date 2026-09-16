import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api';

export interface VentaRespuesta {
  status: string;
  venta_id: number;
  mp_order_id: string;
  checkout_url: string;
  init_point: string;
}

export interface CheckoutDatos {
  nombre: string;
  telefono: string;
  email: string;
  fotos_ids: number[];
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  constructor(private api: ApiService) {}

  crear(datos: CheckoutDatos): Observable<VentaRespuesta> {
    return this.api
      .post('crear_venta.php', {
        nombre: datos.nombre,
        whatsapp: datos.telefono,
        email: datos.email,
        fotos_ids: datos.fotos_ids,
      })
      .pipe(map((res) => res as VentaRespuesta));
  }
}