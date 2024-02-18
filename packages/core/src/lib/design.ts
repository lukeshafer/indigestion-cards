import { ElectroError, Service } from 'electrodb';
import {
  type CardDesign,
  type CreateCardDesign,
  type UpdateCardDesign,
  cardDesigns,
} from '../db/cardDesigns';
import { cardInstances } from '../db/cardInstances';
import { config } from '../db/_utils';
import type { DBResult } from '../types';

export async function getAllCardDesigns() {
  const results = await cardDesigns.query.allDesigns({}).go({ pages: 'all' });
  return results.data;
}

export async function getCardDesignById(args: { designId: string }) {
  const result = await cardDesigns.get(args).go();
  return result.data;
}

export async function getCardDesignAndInstancesById(args: { designId: string }) {
  const db = new Service(
    {
      cardDesigns,
      cardInstances,
    },
    config
  );

  const result = await db.collections.designAndCards(args).go({ pages: 'all' });
  return result.data;
}

export async function deleteCardDesignById(args: { designId: string }) {
  const design = await getCardDesignAndInstancesById(args);
  if (design.cardInstances.length > 0)
    return {
      success: false,
      error: 'Cannot delete design with existing instances',
    };

  const result = await cardDesigns.delete(args).go();

  return { success: true, data: result.data };
}

export async function createCardDesign(card: CreateCardDesign): Promise<DBResult<CardDesign>> {
  try {
    const result = await cardDesigns.create({ ...card }).go();
    return { success: true, data: result.data };
  } catch (err) {
    if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

    if (err.code === 4001)
      // aws error, design already exists
      return {
        success: false,
        error: 'Design already exists',
      };

    // default
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function updateCardDesign(args: UpdateCardDesign & { designId: string }) {
  const { designId, ...rest } = args;
  const result = await cardDesigns.patch({ designId }).set(rest).go();
  return { success: true, data: result.data };
}
