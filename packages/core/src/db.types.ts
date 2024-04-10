import { type EntityItem, type CreateEntityItem, type UpdateEntityItem } from 'electrodb';
import type * as db from './db';

export type Admin = EntityItem<typeof db.admins>;

export type CardDesign = EntityItem<typeof db.cardDesigns>;
export type CreateCardDesign = CreateEntityItem<typeof db.cardDesigns>;
export type UpdateCardDesign = UpdateEntityItem<typeof db.cardDesigns>;

export type CardInstance = EntityItem<typeof db.cardInstances>;

export type MomentRedemption = EntityItem<typeof db.momentRedemptions>;

export type PackType = EntityItem<typeof db.packTypes>;
export type CreatePackType = CreateEntityItem<typeof db.packTypes>;

export type Pack = EntityItem<typeof db.packs>;

export type Preorder = EntityItem<typeof db.preorders>;
export type CreatePreorder = CreateEntityItem<typeof db.preorders>;

export type Rarity = EntityItem<typeof db.rarities>;
export type CreateRarity = CreateEntityItem<typeof db.rarities>;
export type UpdateRarity = UpdateEntityItem<typeof db.rarities>;

export type Season = EntityItem<typeof db.seasons>;
export type CreateSeason = CreateEntityItem<typeof db.seasons>;
export type UpdateSeason = UpdateEntityItem<typeof db.seasons>;

export type SiteConfig = EntityItem<typeof db.siteConfig>;
export type CreateSiteConfig = CreateEntityItem<typeof db.siteConfig>;

export type Trade = EntityItem<typeof db.trades>;
export type CreateTrade = CreateEntityItem<typeof db.trades>;
export type UpdateTrade = UpdateEntityItem<typeof db.trades>;
export type TradeCard = Trade['offeredCards'][number];

export type TwitchEventMessageHistory = EntityItem<typeof db.twitchEventMessageHistory>;

export type TwitchEvent = EntityItem<typeof db.twitchEvents>;
export type CreateTwitchEvent = CreateEntityItem<typeof db.twitchEvents>;
export type UpdateTwitchEvent = UpdateEntityItem<typeof db.twitchEvents>;

export type UnmatchedImage = EntityItem<typeof db.unmatchedImages>;
export type CreateUnmatchedImage = CreateEntityItem<typeof db.unmatchedImages>;
export type UnmatchedImageType = 'cardDesign' | 'frame';

export type UserLogin = EntityItem<typeof db.userLogins>;
export type CreateUserLogin = CreateEntityItem<typeof db.userLogins>;

export type User = EntityItem<typeof db.users>;
export type CreateUser = CreateEntityItem<typeof db.users>;
