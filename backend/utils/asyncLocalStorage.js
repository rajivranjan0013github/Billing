import { AsyncLocalStorage } from 'async_hooks';

const hospitalContext = new AsyncLocalStorage();

export const getHospitalId = () => {
  return hospitalContext.getStore();
};

export const runWithHospitalContext = (hospitalId, callback) => {
  return hospitalContext.run(hospitalId, callback);
};