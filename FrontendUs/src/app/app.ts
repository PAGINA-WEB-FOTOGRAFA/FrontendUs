import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EventosService, Evento, Foto } from './core/services/eventos';
import { VentasService, VentaRespuesta } from './core/services/ventas';
import { API_URL } from './core/services/api';

export interface CarritoItem {
  foto: Foto;
  eventoId: number;
  eventoNombre: string;
  precio: number;
}

export interface FotoEnVista {
  foto: Foto;
  eventoId: number;
  eventoNombre: string;
  precio: number;
}

@Component({
  selector: 'app-root',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private eventosService = inject(EventosService);
  private ventas = inject(VentasService);

  eventosLista: Evento[] = [];
  cargando = true;
  error = '';
  anio = new Date().getFullYear();

  eventoSeleccionado: Evento | null = null;
  fotoEnVista: FotoEnVista | null = null;

  carrito: CarritoItem[] = [];
  carritoAbierto = false;
  finalizando = false;

  nombre = '';
  telefono = '';
  email = '';
  procesandoPago = false;
  errorPago = '';

  ngOnInit(): void {
    this.cargarEventos();
  }

  private cargarEventos(): void {
    this.eventosService.listar().subscribe({
      next: (lista) => {
        this.eventosLista = lista;
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

  get totalCarrito(): number {
    return this.carrito.reduce((acc, item) => acc + (Number(item.precio) || 0), 0);
  }

  get cantidadCarrito(): number {
    return this.carrito.length;
  }

  enCarrito(fotoId: number): boolean {
    return this.carrito.some((i) => i.foto.id === fotoId);
  }

  abrirEvento(evento: Evento): void {
    this.fotoEnVista = null;
    this.eventoSeleccionado = evento;

    if (!evento.fotos) {
      this.eventosService.obtener(evento.id).subscribe((detalle) => {
        if (detalle && this.eventoSeleccionado?.id === evento.id) {
          this.eventoSeleccionado = detalle;
        }
      });
    }
  }

  volverAInicio(): void {
    this.eventoSeleccionado = null;
    this.fotoEnVista = null;
    setTimeout(() => {
      document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  abrirFoto(foto: Foto): void {
    const evento = this.eventoSeleccionado;
    if (!evento) {
      return;
    }
    this.fotoEnVista = {
      foto,
      eventoId: evento.id,
      eventoNombre: evento.nombre,
      precio: Number(foto.precio ?? evento.precio_foto) || 0,
    };
  }

  cerrarFoto(): void {
    this.fotoEnVista = null;
  }

  agregarAlCarrito(): void {
    const vista = this.fotoEnVista;
    if (!vista || this.enCarrito(vista.foto.id)) {
      return;
    }
    this.carrito.push({
      foto: vista.foto,
      eventoId: vista.eventoId,
      eventoNombre: vista.eventoNombre,
      precio: vista.precio,
    });
    this.cerrarFoto();
  }

  quitarDelCarrito(fotoId: number): void {
    this.carrito = this.carrito.filter((i) => i.foto.id !== fotoId);
    if (this.fotoEnVista && this.fotoEnVista.foto.id === fotoId) {
      this.fotoEnVista = null;
    }
  }

  abrirCarrito(): void {
    this.carritoAbierto = true;
    this.finalizando = false;
    this.errorPago = '';
  }

  cerrarCarrito(): void {
    this.carritoAbierto = false;
    this.finalizando = false;
  }

  irAFinalizar(): void {
    if (this.carrito.length === 0) {
      return;
    }
    this.finalizando = true;
    this.errorPago = '';
  }

  volverDelCheckout(): void {
    this.finalizando = false;
  }

  finalizarCompra(): void {
    const nombre = this.nombre.trim();
    const telefono = this.telefono.trim();
    const email = this.email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (this.carrito.length === 0) {
      return;
    }
    if (nombre === '') {
      this.errorPago = 'Completá tu nombre.';
      return;
    }
    if (telefono === '') {
      this.errorPago = 'Completá tu teléfono.';
      return;
    }
    if (!emailOk) {
      this.errorPago = 'Ingresá un email válido.';
      return;
    }

    this.procesandoPago = true;
    this.errorPago = '';

    this.ventas
      .crear({
        nombre,
        telefono,
        email,
        fotos_ids: this.carrito.map((i) => i.foto.id),
      })
      .subscribe({
        next: (res: VentaRespuesta) => {
          this.procesandoPago = false;
          const url = res.checkout_url || res.init_point;
          if (url) {
            window.location.href = url;
          } else {
            this.errorPago = 'No se pudo obtener el link de pago.';
          }
        },
        error: (err) => {
          this.procesandoPago = false;
          this.errorPago = err?.error?.message ?? 'No se pudo completar la compra. Intentalo de nuevo.';
        },
      });
  }
}