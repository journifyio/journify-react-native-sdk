export const mapTraits: { [key: string]: string } = {
  userId: 'uid',
  email: 'u_em',
  gender: 'u_gd',
  birthday: 'u_bd',
  name: 'u_n',
  firstname: 'u_fn',
  lastname: 'u_ln',
  phone: 'u_mb',
};

export const transformMap: { [key: string]: (value: unknown) => unknown } = {
  event: (value: unknown) => {
    if (typeof value === 'string') {
      if (value in mapTraits) {
        return mapTraits[value];
      }
    }
    return value;
  },
};
