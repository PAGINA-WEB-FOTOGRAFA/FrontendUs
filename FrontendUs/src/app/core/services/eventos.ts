import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api';

export interface Foto {
  id: number;
  ruta: string;
  precio?: number | string;
  evento_nombre?: string;
}

export interface Evento {
  id: number;
  nombre: string;
  lugar: string;
  fecha_evento: string;
  precio_foto: number;
  activo: number;
  portada?: string | null;
  fecha_creacion?: string;
  fotos?: Foto[];
}

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  constructor(private api: ApiService) {}

  listar(): Observable<Evento[]> {
    return this.api.get('get_eventos.php').pipe(map((res) => res?.eventos ?? []));
  }

  obtener(id: number): Observable<Evento> {
    return this.api.get(`get_eventos.php?id=${id}`).pipe(map((res) => res?.evento));
  }
}