import { isFulfilled, isRejected } from "../../utils";

describe("Test promise utilities", () => {
  it("should correctly filter out rejected and fulfilled promises", async () => {
    const promiseFulfill = new Promise((resolve, _reject) => {
      resolve(null);
    });
    const promiseReject = new Promise((_resolve, reject) => {
      reject();
    });

    const promisesArray = [promiseFulfill, promiseReject];

    const promises = await Promise.allSettled(promisesArray);

    expect(promises.filter(isFulfilled).length).toBe(1);
    expect(promises.filter(isRejected).length).toBe(1);
  });
});
