import {v4, validate} from "uuid";

/**
 * Retrieves the device ID from local storage. A device ID is a unique GUID that is stored in local storage. If one does not exist, a new one is generated.
 */
export const getDeviceId = (): string => {
  let id = localStorage.getItem("deviceId");
  if (!id || !validate(id)) {
    id = v4();
    localStorage.setItem("deviceId", id);
  }

  return id;
};
