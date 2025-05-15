import { AsyncLocalStorage } from "async_hooks";

const pharmacyContext = new AsyncLocalStorage();

export const getPharmacyId = () => {
  return pharmacyContext.getStore();
};

export const runWithPharmacyContext = (pharmacyId, callback) => {
  return pharmacyContext.run(pharmacyId, callback);
};
