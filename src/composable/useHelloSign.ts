import HelloSign from 'hellosign-embedded';

import env from 'InvestCommon/global';

import { ISignature } from 'InvestCommon/types/api/invest';

interface IHelloSign {
  open: (signUrl: string, props: object) => void;
  close: () => void;
  on: (event: string, callback: unknown) => void;
}

export const useHelloSign = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const client = new HelloSign() as IHelloSign;

  const openHelloSign = (signUrl: string, domEl: string) => {
    client.open(signUrl, {
      clientId: env.HELLOSIGN_CLIENT_ID,
      skipDomainVerification: true,
      container: document.getElementById(domEl),
    });
  };

  const closeHelloSign = () => {
    client.close();
  };

  const onSign = (callback: (data: ISignature) => Promise<unknown>) => {
    client.on('sign', callback);
  };

  const onClose = (callback: () => void) => {
    client.on('close', callback);
  };

  return {
    onClose,
    onSign,
    openHelloSign,
    closeHelloSign,
  };
};
