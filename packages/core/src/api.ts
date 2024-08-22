import { JournifyEvent } from './events';

export const uploadEvents = async ({
  url,
  events,
}: {
  url: string;
  events: JournifyEvent[];
}) => {
  return await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      batch: events,
    }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
