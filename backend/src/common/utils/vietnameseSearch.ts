const VIETNAMESE_CHAR_MAP: Record<string, string> = {
  a: "[aàáảãạâầấẩẫậăằắẳẵặAÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶ]",
  e: "[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]",
  i: "[iìíỉĩịIÌÍỈĨỊ]",
  o: "[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]",
  u: "[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]",
  y: "[yỳýỷỹỵYỲÝỶỸỴ]",
  d: "[dđDĐ]"
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const stripVietnameseAccents = (str: string): string =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");

export const makeVietnameseSearchRegex = (query: string): string => {
  const normalized = stripVietnameseAccents(query.toLowerCase());
  const escaped = escapeRegex(normalized);
  let pattern = "";
  for (const char of escaped) {
    pattern += VIETNAMESE_CHAR_MAP[char] || char;
  }
  return pattern;
};
