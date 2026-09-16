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

  logoUrl = '/Logo.jpeg';
  fotoPrincipalUrl = '/FotoPrincipal.jpeg';
  nombreFotografa = 'Paola Peñalva';
  tituloLanding = 'Paola Peñalva';
  descripcionLanding =
    'Capturamos la energía, la pasión y la emoción de cada momento  para convertirlos en recuerdos inolvidables ✨';
  quienesSomosTexto =
    'Detrás del lente hay alguien que disfruta cada historia que se cuenta en un evento. Esta es mi forma de trabajo y la dedicación que pongo en cada foto, para que ese recuerdo quede para siempre.';
  emailContacto = 'paolapenalva2@gmail.com';
  whatsappNumero = '+54 9 3534 78-2182';
  adminUrl = 'http://localhost:4201';

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

  waLink(): string {
    return `https://wa.me/${this.whatsappNumero.replace(/\D/g, '')}`;
  }
}