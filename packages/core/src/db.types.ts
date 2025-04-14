import type { EntityItem, CreateEntityItem, UpdateEntityItem } from 'electrodb';
import type { db } from './db';

export type Admin = EntityItem<typeof db.entities.Admins>;

export type CardDesign = EntityItem<typeof db.entities.CardDesigns>;
export type CreateCardDesign = CreateEntityItem<typeof db.entities.CardDesigns>;
export type UpdateCardDesign = UpdateEntityItem<typeof db.entities.CardDesigns>;

export type CardInstance = EntityItem<typeof db.entities.CardInstances>;

export type MomentRedemption = EntityItem<typeof db.entities.MomentRedemptions>;

export type PackType = EntityItem<typeof db.entities.PackTypes>;
export type CreatePackType = CreateEntityItem<typeof db.entities.PackTypes>;

export type Pack = EntityItem<typeof db.entities.Packs>;
export type PackCardsHidden = Omit<Pack, 'cardDetails'> & { cardDetails?: undefined };

export type Preorder = EntityItem<typeof db.entities.Preorders>;
export type CreatePreorder = CreateEntityItem<typeof db.entities.Preorders>;

export type Rarity = EntityItem<typeof db.entities.Rarities>;
export type CreateRarity = CreateEntityItem<typeof db.entities.Rarities>;
export type UpdateRarity = UpdateEntityItem<typeof db.entities.Rarities>;

export type Season = EntityItem<typeof db.entities.Seasons>;
export type CreateSeason = CreateEntityItem<typeof db.entities.Seasons>;
export type UpdateSeason = UpdateEntityItem<typeof db.entities.Seasons>;

export type SiteConfig = EntityItem<typeof db.entities.SiteConfig>;
export type CreateSiteConfig = CreateEntityItem<typeof db.entities.SiteConfig>;

export type Trade = EntityItem<typeof db.entities.Trades>;
export type CreateTrade = CreateEntityItem<typeof db.entities.Trades>;
export type UpdateTrade = UpdateEntityItem<typeof db.entities.Trades>;
export type TradeCard = Trade['offeredCards'][number];
export type TradePack = NonNullable<Trade['offeredPacks']>[number];

export type TwitchEventMessageHistory = EntityItem<typeof db.entities.TwitchEventMessageHistory>;

export type TwitchEvent = EntityItem<typeof db.entities.TwitchEvents>;
export type CreateTwitchEvent = CreateEntityItem<typeof db.entities.TwitchEvents>;
export type UpdateTwitchEvent = UpdateEntityItem<typeof db.entities.TwitchEvents>;

export type UnmatchedImage = EntityItem<typeof db.entities.UnmatchedImages>;
export type CreateUnmatchedImage = CreateEntityItem<typeof db.entities.UnmatchedImages>;
export type UnmatchedImageType = 'cardDesign' | 'frame';

export type UserLogin = EntityItem<typeof db.entities.UserLogins>;
export type CreateUserLogin = CreateEntityItem<typeof db.entities.UserLogins>;

export type User = EntityItem<typeof db.entities.Users>;
export type CreateUser = CreateEntityItem<typeof db.entities.Users>;

export type Collection = NonNullable<User['collections']>[number]
export type CollectionRules = NonNullable<Collection['rules']>
export type CollectionRulesSort = NonNullable<CollectionRules['sort']>
export type CollectionCards = NonNullable<Collection['cards']>
