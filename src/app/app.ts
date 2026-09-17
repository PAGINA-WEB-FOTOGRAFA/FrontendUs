import { Component, HostListener, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EventosService, Evento, Foto } from './core/services/eventos';
import { ApiService, API_URL } from './core/services/api';

export interface CarritoItem {
  fotoId: number;
  ruta: string;
  nombreFoto: string;
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
  private eventos = inject(EventosService);
  private api = inject(ApiService);

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

  eventoAbierto: Evento | null = null;
  fotoAmpliada: Foto | null = null;

  abrirEvento(evento: Evento): void {
    this.eventoAbierto = evento;
  }

  cerrarEvento(): void {
    this.eventoAbierto = null;
    this.fotoAmpliada = null;
  }

  verFoto(foto: Foto): void {
    this.fotoAmpliada = foto;
  }

  cerrarVisor(): void {
    this.fotoAmpliada = null;
  }

  anterior(): void {
    this.moverFoto(-1);
  }

  siguiente(): void {
    this.moverFoto(1);
  }

  private moverFoto(delta: number): void {
    const fotos = this.eventoAbierto?.fotos ?? [];
    if (!this.fotoAmpliada || fotos.length === 0) return;
    const i = fotos.findIndex((f) => f.id === this.fotoAmpliada!.id);
    if (i < 0) return;
    const siguiente = (i + delta + fotos.length) % fotos.length;
    this.fotoAmpliada = fotos[siguiente];
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.checkoutAbierto && event.key === 'Escape') {
      this.cerrarCheckout();
      return;
    }
    if (this.carritoAbierto && event.key === 'Escape') {
      this.cerrarCarrito();
      return;
    }
    if (this.fotoAmpliada) {
      if (event.key === 'Escape') this.cerrarVisor();
      if (event.key === 'ArrowLeft') this.anterior();
      if (event.key === 'ArrowRight') this.siguiente();
      return;
    }
    if (!this.eventoAbierto) return;
    if (event.key === 'Escape') {
      this.cerrarEvento();
    }
  }

  // ---------------------------------- Carrito ----------------------------------
  carritoItems: CarritoItem[] = [];
  carritoAbierto = false;

  checkoutAbierto = false;
  enviandoCheckout = false;
  errorCheckout = '';
  datosCompra = { nombre: '', apellido: '', whatsapp: '', email: '' };

  enCarrito(fotoId: number): boolean {
    return this.carritoItems.some((item) => item.fotoId === fotoId);
  }

  toggleFoto(foto: Foto): void {
    if (!this.eventoAbierto) return;

    const existe = this.carritoItems.findIndex((item) => item.fotoId === foto.id);
    if (existe >= 0) {
      this.carritoItems.splice(existe, 1);
      return;
    }

    this.carritoItems.push({
      fotoId: foto.id,
      ruta: foto.ruta,
      nombreFoto: this.nombreDeRuta(foto.ruta),
      eventoNombre: this.eventoAbierto.nombre,
      precio: Number(this.eventoAbierto.precio_foto) || 0,
    });
  }

  quitarDelCarrito(fotoId: number): void {
    this.carritoItems = this.carritoItems.filter((item) => item.fotoId !== fotoId);
  }

  vaciarCarrito(): void {
    this.carritoItems = [];
  }

  abrirCarrito(): void {
    this.carritoAbierto = true;
  }

  cerrarCarrito(): void {
    this.carritoAbierto = false;
  }

  get cantidadCarrito(): number {
    return this.carritoItems.length;
  }

  get subtotal(): number {
    return this.carritoItems.reduce((acc, item) => acc + (item.precio || 0), 0);
  }

  get total(): number {
    return this.subtotal;
  }

  // ---------------------------------- Checkout ----------------------------------
  abrirCheckout(): void {
    this.checkoutAbierto = true;
    this.errorCheckout = '';
  }

  cerrarCheckout(): void {
    this.checkoutAbierto = false;
  }

  finalizarCompra(): void {
    if (this.enviandoCheckout) return;
    this.errorCheckout = '';

    if (!this.datosCompra.nombre.trim() || !this.datosCompra.whatsapp.trim()) {
      this.errorCheckout = 'Completá tu nombre y tu WhatsApp.';
      return;
    }
    if (!this.datosCompra.email.trim() || !/.+@.+\..+/.test(this.datosCompra.email.trim())) {
      this.errorCheckout = 'Ingresá un email válido.';
      return;
    }
    if (this.carritoItems.length === 0) {
      this.errorCheckout = 'Tu carrito está vacío.';
      return;
    }

    this.enviandoCheckout = true;
    this.api
      .post('crear_venta.php', {
        nombre: this.datosCompra.nombre.trim(),
        apellido: this.datosCompra.apellido.trim(),
        whatsapp: this.datosCompra.whatsapp.trim(),
        email: this.datosCompra.email.trim(),
        fotos_ids: this.carritoItems.map((item) => item.fotoId),
      })
      .subscribe({
        next: (res) => {
          this.enviandoCheckout = false;
          if (res?.status === 'success' && res?.checkout_url) {
            window.location.href = res.checkout_url;
          } else {
            this.errorCheckout = res?.message ?? 'No se pudo iniciar el pago.';
          }
        },
        error: (err) => {
          this.enviandoCheckout = false;
          this.errorCheckout = err?.error?.message ?? 'No se pudo iniciar el pago.';
        },
      });
  }

  nombreDeRuta(ruta: string): string {
    return ruta.split('/').pop() ?? ruta;
  }

  fotoUrl(ruta: string): string {
    return `${API_URL}/${ruta}`;
  }

  waLink(): string {
    return `https://wa.me/${this.whatsappNumero.replace(/\D/g, '')}`;
  }
}