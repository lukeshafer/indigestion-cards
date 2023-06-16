//import { db } from '../db';
//import type { Entity as ElectroEntity } from 'electrodb';

//const pack = await db.entities.packs.scan.go();

//type Entity = ElectroEntity<any, any, any, any>;

//class Migration {
//private name: string;
//private oldEntity: Entity;
//private newEntity: Entity;
//private fn: (oldEntity: Entity, newEntity: Entity) => void;

//constructor(
//name: string,
//oldEntity: Entity,
//newEntity: Entity,
//fn: (oldEntity: Entity, newEntity: Entity) => void
//) {
//this.name = name;
//this.oldEntity = oldEntity;
//this.newEntity = newEntity;
//this.fn = fn;
//}

//public async run() {
//console.log(`Running migration: ${this.name}`);
//await this.fn(this.oldEntity, this.newEntity);
//}
//}
