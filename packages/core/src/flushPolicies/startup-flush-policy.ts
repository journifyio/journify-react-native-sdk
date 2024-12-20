import type { JournifyEvent } from '../events';
import { FlushPolicyBase } from './types';

/**
 * StatupFlushPolicy triggers a flush right away on client startup
 */
export class StartupFlushPolicy extends FlushPolicyBase {
  constructor() {
    super();
    this.shouldFlush.value = true;
  }

  start(): void {
    // Nothing to do
  }

  onEvent(_event: JournifyEvent): void {
    // Nothing to do
  }
}
