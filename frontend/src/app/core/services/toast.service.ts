import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(text: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    const newToast: ToastMessage = { id, text, type, icon };

    this.toastsSignal.update(list => [...list, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string) {
    this.toastsSignal.update(list => list.filter(t => t.id !== id));
  }
}
