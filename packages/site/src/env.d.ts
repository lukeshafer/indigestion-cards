/* eslint-disable */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
declare global {
  namespace App {
    interface Locals {
      siteConfig: SiteConfig;
      session: Session | null;
      admin: AdminSession | null;
      user: UserSession | AdminSession | null;
    }
  }
}

import type { Session as AuthSession } from '@lil-indigestion-cards/core/types';
import type { SiteConfig } from '../../core/src/db.types';

declare type Session = AuthSession;

interface PublicSession {
  type: 'public';
  properties: {
    userId?: null | undefined;
    username?: null | undefined;
  };
}

interface UserSession {
  type: 'user';
  properties: {
    userId: string;
    username: string;
  };
}

interface AdminSession {
  type: 'admin';
  properties: {
    userId: string;
    username: string;
  };
}

export { Session };

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      clickOutside: any
      searchDirective: any
      showPreview: any
    }
  }
}

interface CustomEventMap {
  removecardclick: CustomEvent<{
    instanceId: string | null;
    node: HTMLElement;
  }>;
}

declare global {
  interface HTMLElement {
    //adds definition to Document, but you can do the same with HTMLElement
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: CustomEventMap[K]) => void
    ): void;
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
  }
  interface Node {
    //adds definition to Document, but you can do the same with HTMLElement
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Node, ev: CustomEventMap[K]) => void
    ): void;
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
  }
  interface Document {
    //adds definition to Document, but you can do the same with HTMLElement
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void
    ): void;
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
  }
}

