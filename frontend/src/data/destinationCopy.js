/*
  The destinations table has no marketing-copy column yet, so the short
  descriptions shown on the site live here, keyed by the destination slug
  from the database. Everything else (name, location, price, image) comes
  from the API — only this editorial text is still static.
*/
const DESCRIPTIONS_BY_SLUG = {
  "casa-del-papa":
    "Un refuge paisible entre l’océan et la lagune, pensé pour ralentir et se retrouver.",
  "village-helene":
    "Une adresse calme au bord du lac, entourée de nature et propice à la déconnexion.",
  sofitel:
    "Une expérience contemporaine entre confort haut de gamme, spa et proximité de l’océan.",
  novotel:
    "Un séjour moderne et accessible, idéal pour découvrir Cotonou en toute simplicité.",
};

const FALLBACK_DESCRIPTION =
  "Un séjour sélectionné par STAY pour son confort et son cadre.";

export function getDestinationDescription(slug) {
  return DESCRIPTIONS_BY_SLUG[slug] || FALLBACK_DESCRIPTION;
}
