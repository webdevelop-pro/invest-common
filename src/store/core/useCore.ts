// eslint-disable-next-line object-curly-newline
import { Ref, ref } from 'vue';

import { Person } from '@/classes/Person';
import { Invest } from '@/classes/Invest';
import { Socket } from '@/classes/Socket';
import { Accreditation } from '@/classes/Accreditation';

const person = ref(Person.buildClass()) as Ref<Person>;
const invest = ref(Invest.buildClass()) as Ref<Invest>;
const socket = ref(Socket.buildClass()) as Ref<Socket>;
const accreditation = ref(Accreditation.buildClass()) as Ref<Accreditation>;

export const useCore = () => ({
  person,
  invest,
  socket,
  accreditation,
});
