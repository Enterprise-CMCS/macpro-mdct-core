const originalDefineProperty = Object.defineProperty;
Object.defineProperty = (obj, prop, desc) => {
  try {
    return originalDefineProperty(obj, prop, { ...desc, configurable: true });
  } catch (e) {
    return originalDefineProperty(obj, prop, desc);
  }
};
Object.defineProperties = (obj, props) => {
  Object.keys(props).forEach((key) => {
    Object.defineProperty(obj, key, props[key]);
  });
  return obj;
};

export {};
