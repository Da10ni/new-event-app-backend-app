export const pickFields = (obj, fields) => {
  return fields.reduce((result, field) => {
    if (obj[field] !== undefined) {
      result[field] = obj[field];
    }
    return result;
  }, {});
};
