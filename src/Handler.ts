import { Priority } from './enums';
import { KeyPressEvent } from './events';
import { HandlerKey, HandlerType } from './models';

type NewHandler = {
  ownerId: string;
  key: HandlerKey;
  type: HandlerType;
  priority: Priority;
  disabled: boolean;
  action: (ev: KeyPressEvent) => Promise<void>;
};

export class Handler {
  ownerId: string;
  key: HandlerKey;
  type: HandlerType;
  priority: Priority;
  disabled: boolean;
  action: (ev: KeyPressEvent) => Promise<void>;
  working = false;

  constructor(handler: NewHandler) {
    this.ownerId = handler.ownerId;
    this.key = handler.key;
    this.type = handler.type;
    this.priority = handler.priority;
    this.disabled = handler.disabled;
    this.action = handler.action;
  }

  get fullName(): string {
    let type;
    switch (this.type) {
      case 'short':
        type = 'Short';
        break;
      case 'long':
        type = 'Long';
        break;
      case 'repeat':
        type = 'Repeat';
        break;
    }

    return `on${this.key}${type}`;
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }

  call(ev: KeyPressEvent): Promise<void> {
    if (this.working) {
      return Promise.resolve();
    }

    // console.log(`${this.fullName}: called`);
    this.working = true;

    return this.action(ev)
      .catch((err) => {
        console.log(`Failed to call handler: ${this.fullName}`, err);
      })
      .finally(() => {
        // console.log(`${this.fullName}: finished`);
        this.working = false;
      });
  }
}
