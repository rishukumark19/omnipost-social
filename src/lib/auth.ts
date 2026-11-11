import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getUsers, findOrCreateUser, DEFAULT_USERS } from './db';
import { User } from './types';

export const SESSION_COOKIE_NAME = 'insta_google_session';

export function getSessionUserIdFromCookies(): string {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (session && session.value) {
    return session.value;
  }
  return DEFAULT_USERS[0].id;
}

export function getSessionUserIdFromRequest(req: NextRequest): string {
  const session = req.cookies.get(SESSION_COOKIE_NAME);
  if (session && session.value) {
    return session.value;
  }
  const headerUserId = req.headers.get('x-user-id');
  if (headerUserId) {
    return headerUserId;
  }
  return DEFAULT_USERS[0].id;
}

export function getCurrentUser(): User {
  const userId = getSessionUserIdFromCookies();
  const allUsers = getUsers();
  const user = allUsers.find((u) => u.id === userId);
  return user || DEFAULT_USERS[0];
}
