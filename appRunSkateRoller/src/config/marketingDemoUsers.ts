/** Id estable para el usuario demo Alex Azcapo (mock web y migración de ventas). */
export const ALEX_AZCAPO_USER_ID = 'user-alex-azcapo';

const ALEX_AZCAPO_EMAIL = 'alex.azcapo@roller.com';

type ProfileLike = {
  id?: string | number;
  email?: string;
  alias?: string | null;
};

/** Mismo usuario “Alex Azcapo” con id de API o con id mock `user-alex-azcapo`. */
export function isAlexAzcapoProfile(user: ProfileLike | null): boolean {
  if (!user) {
    return false;
  }
  if (String(user.id) === ALEX_AZCAPO_USER_ID) {
    return true;
  }
  const e = (user.email || '').toLowerCase().trim();
  if (e === ALEX_AZCAPO_EMAIL) {
    return true;
  }
  const a = (user.alias || '').trim().toLowerCase();
  return a === 'alex azcapo';
}

/**
 * Dueño de una publicación de marketing: coincide id de sesión o
 * publicación migrada a `user-alex-azcapo` vinculada al perfil Alex.
 */
export function userOwnsMarketingSale(
  saleOwnerId: string | undefined,
  me: ProfileLike | null,
): boolean {
  if (me?.id == null || !saleOwnerId) {
    return false;
  }
  if (String(saleOwnerId) === String(me.id)) {
    return true;
  }
  if (saleOwnerId === ALEX_AZCAPO_USER_ID && isAlexAzcapoProfile(me)) {
    return true;
  }
  return false;
}
