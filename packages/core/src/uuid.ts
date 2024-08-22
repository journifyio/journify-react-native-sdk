import uuid from 'react-native-uuid';

export const getUUID = (): string => {
  const UUID = uuid.v4().toString();
  return UUID;
};
