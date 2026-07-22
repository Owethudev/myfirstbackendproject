export const CLASSMATES = [
  "Owethu Jezile",
  "Malebo Nkuna",
  "Portia Mashaba",
  "Sijabulile Ncube",
  "Shaun Maselela",
  "Refilwe Segoe",
  "Lesedi Modikwe",
  "Bheki Buthelezi",
  "Gareth Motloutsi",
  "Thami Sithole",
  "Qiyaam Moodley",
  "Galaletsang Modise",
  "Lerato Thungo",
  "Mhlengi Ngwenya",
  "David Ndlovu",
  "Noluthando Molui",
  "Tswarelo Madonsela",
  "Nyiko Vumani",
  "Mpho Mangena",
  "Elias Mtisie",
  "Mandla Sikhosana",
  "Thandokuhle Maphanga",
  "Bao Kekana",
  "Kabelo Mathapo",
] as const;

// The names appear twice so the moving list can loop without a gap.
export const MARQUEE_ITEMS = [...CLASSMATES, ...CLASSMATES];
