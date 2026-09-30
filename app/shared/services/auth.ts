import { sql, session, AuthError } from "@elements/app";

interface User {
  id: string;
  handle: string;
}

export const MIN_PASSWORD = 8;

/** The accounts the demo seed creates, all with the same password. */
export const SEED_PASSWORD = "upvotehall";

export const SEED_HANDLES = [
  "kernelpanic",
  "lambdalena",
  "rustacean_ro",
  "segfault_sam",
  "monadmaya",
  "yakshaver",
  "ptrpriya",
  "gcgarbo",
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function isHandle(handle: string): boolean {
  return /^[a-zA-Z0-9_]{2,20}$/.test(handle);
}

/** @rpc */
export function signin(handle: string, password: string) {
  let name = handle.trim();

  if (!name || !password) {
    throw new AuthError("enter your username and password");
  }

  let user = sql<User>(`
    select id, handle from users
     where lower(handle) = lower(${name})
       and passwordHash = crypt(${password}, passwordHash)
  `).first();

  if (!user) {
    throw new AuthError("invalid username or password");
  }

  session.login({ userId: user.id, userName: user.handle });
}

/** @rpc */
export function signup(handle: string, email: string, password: string) {
  let name = handle.trim();
  let address = normalizeEmail(email);

  if (!isHandle(name)) {
    throw new AuthError("usernames are 2 to 20 letters, digits or underscores");
  }

  if (!isEmail(address)) {
    throw new AuthError("enter a valid email address");
  }

  if (password.length < MIN_PASSWORD) {
    throw new AuthError(`password must be at least ${MIN_PASSWORD} characters`);
  }

  if (!sql(`select 1 from users where lower(handle) = lower(${name})`).empty()) {
    throw new AuthError("that username is taken");
  }

  if (!sql(`select 1 from users where email = ${address}`).empty()) {
    throw new AuthError("that email is already registered");
  }

  let user = sql<User>(`
    insert into users (handle, email, passwordHash)
         values (${name}, ${address}, crypt(${password}, genSalt('bf', 12)))
      returning id, handle
  `).firstOrThrow();

  session.login({ userId: user.id, userName: user.handle });
}

/** @rpc */
export function signout() {
  session.logout();
}
