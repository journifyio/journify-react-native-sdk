import type { JournifyClient } from '../analytics';
import { createClient } from '../client';

describe('create client', () => {
  const config = {
    writeKey: 'test',
  };

  let client: JournifyClient;
  it('creates the client with the provided writeKey', () => {
    client = createClient(config);
    expect(client.getConfig().writeKey).toBe(config.writeKey);
  });
  it('throws an error if the writeKey is not provided', () => {
    expect(() => createClient({} as any)).toThrow('writeKey is required');
  });
  it('creates the client with the provided additional config', () => {
    const additionalConfig = {
      writeKey: 'test',
    };
    client = createClient(additionalConfig);
    expect(client.getConfig().writeKey).toBe(additionalConfig.writeKey);
  });
});
