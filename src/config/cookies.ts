"use server";
// app/some-server-file.ts

import { headers } from 'next/headers';
import { alchemyConfig } from './alchemyConfig';
import { cookieToInitialState } from '@account-kit/core';

export async function getInitialStateAsync() {
  const headersList = headers(); // still no await here
  const cookie = (await headersList).get('cookie') ?? undefined;

  return cookieToInitialState(alchemyConfig, cookie);
}

