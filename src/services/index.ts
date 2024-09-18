import { StorageService } from './StorageService';
import { ISignature } from 'InvestCommon/types/api/invest';
import { IFilesData } from '@/views/Accreditation/utils';

export const storage = {
  loggedIn: new StorageService<boolean>('loggedIn'),
  profileId: new StorageService<number>('profileId'),
  signature: new StorageService<ISignature | null>('signature'),
  accreditation: new StorageService<IFilesData | null>('accreditation'),
};

export * from './api';
