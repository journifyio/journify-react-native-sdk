import appsFlyer from 'react-native-appsflyer';
import { JournifyEvent } from '@journifyio/react-native-sdk';

export default (event: JournifyEvent) => {
  const userId = event.userId;
  if (userId !== undefined && userId !== null && userId.length > 0) {
    appsFlyer.setCustomerUserId(userId);
  }

  const traits = event.traits;
  if (traits !== undefined && traits !== null) {
    const aFTraits: {
      email?: string;
      firstname?: string;
      lastname?: string;
      phone?: string;
    } = {};

    if (traits.email !== undefined && traits.email !== null) {
      aFTraits.email = traits.email;
    }

    if (traits.firstname !== undefined && traits.firstname !== null) {
      aFTraits.firstname = traits.firstname;
    }

    if (traits.lastname !== undefined && traits.lastname !== null) {
      aFTraits.lastname = traits.lastname;
    }
    if (traits.phone !== undefined && traits.phone !== null) {
      aFTraits.phone = traits.phone;
    }

    appsFlyer.setAdditionalData(aFTraits);
  }
};
