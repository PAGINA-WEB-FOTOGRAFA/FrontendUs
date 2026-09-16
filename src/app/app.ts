import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { EventosService, Evento } from './core/services/eventos';
import { API_URL } from './core/services/api';

@Component({
  selector: 'app-root',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private eventos = inject(EventosService);

  eventosLista: Evento[] = [];
  cargando = true;
  error = '';
  anio = new Date().getFullYear();

  ngOnInit(): void {
    this.eventos.listar().subscribe({
      next: (lista) => {
        this.eventosLista = lista;
        for (const evento of this.eventosLista) {
          this.eventos.obtener(evento.id).subscribe((detalle) => {
            evento.fotos = detalle?.fotos ?? [];
          });
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los eventos.';
        this.cargando = false;
      },
    });
  }

  fotoUrl(ruta: string): string {
    return `${API_URL}/${ruta}`;
  }
}