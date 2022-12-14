import getDescriptors from 'object.getownpropertydescriptors';
import { Priority } from './enums';
import { KeyPressEvent } from './events';
import { EventTranslator } from './EventTranslator';
import { Handler } from './Handler';
import { Handlers } from './Handlers';
import { HandlerKey, HandlerMap } from './models';
import { generateId } from './utils';

getDescriptors.shim();

type Config = {
  longPressDelay: number;
  repeatDelay: number;
  repeatRate: number;
};

type HandlerConfig = {
  priority: Priority;
};

const defaultConfig: Config = {
  longPressDelay: 500,
  repeatDelay: 500,
  repeatRate: 100,
};

export class OnyxKeys {
  private static config: Config = defaultConfig;
  private static listening = false;
  private static handlers = Handlers;

  static setOptions(options: Partial<Config>) {
    this.config = {
      ...defaultConfig,
      ...options,
    };
  }

  static subscribe(handlerMap: Partial<HandlerMap>, options?: Partial<HandlerConfig>) {
    const ownerId = generateId();

    this.handlers.add(
      Object.entries(handlerMap).map(([name, action]) => {
        const [, key, duration] = name.match(/on(.*?)(Long|$)/) ?? [];
        return new Handler({
          ownerId,
          key: key as HandlerKey,
          duration: duration ? 'long' : 'short',
          priority: options?.priority ?? Priority.Medium,
          disabled: false,
          action,
        });
      })
    );

    this.startListening();

    return {
      id: ownerId,
      disable: () => this.disable(ownerId),
      enable: () => this.enable(ownerId),
      unsubscribe: () => this.unsubscribe(ownerId),
    };
  }

  static unsubscribe(ownerId: string) {
    this.handlers.removeGroup(ownerId);
  }

  static disable(ownerId: string) {
    this.handlers.disableGroup(ownerId);
  }

  static enable(ownerId: string) {
    this.handlers.enableGroup(ownerId);
  }

  static startListening() {
    if (this.listening) {
      return;
    }

    EventTranslator.start(this.config);

    document.addEventListener('onyx:keypress', this.onKeyPress.bind(this) as any, true);

    this.listening = true;
  }
  static stopListening() {
    if (!this.listening) {
      return;
    }

    EventTranslator.stop();

    document.removeEventListener('onyx:keypress', this.onKeyPress.bind(this) as any, true);

    this.listening = false;
  }

  private static onKeyPress(ev: KeyPressEvent) {
    const handlers = this.handlers.getPriorityHandlers(ev.detail.key, ev.detail.duration);

    if (handlers.length === 0) return;

    ev.stopPropagation();
    ev.stopImmediatePropagation();
    ev.preventDefault();

    handlers.forEach((handler) => handler.call(ev));
  }
}
