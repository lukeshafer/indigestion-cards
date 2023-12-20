import { Checkbox, Form, Select, SubmitButton } from '@/components/form/Form';
import type { Rarity } from '@lil-indigestion-cards/core/db/rarities';
import type { PackType } from '@lil-indigestion-cards/core/db/packTypes';
import type { TwitchEvent } from '@lil-indigestion-cards/core/db/twitchEvents';
import { API } from '@/constants';
import { Show, createSignal } from 'solid-js';
import Table from '../table/Table';
import RarityRanking, { type RarityRankingRecord } from './RarityRanking';
import { PageHeader, PageTitle } from '../text';

export default function SiteConfigForm(props: {
  baseRarityValue: string;
  rarities: Rarity[];
  twitchEvents: TwitchEvent[];
  packTypes: PackType[];
  giftSubEvent: TwitchEvent;
  initialRanking: Record<string, RarityRankingRecord[number]>;
  tradingIsEnabled?: boolean;
}) {
  const [isEdited, setIsEdited] = createSignal(false);
  // eslint-disable-next-line solid/reactivity
  const [rarity, setRarity] = createSignal(props.baseRarityValue);

  return (
    <>
      <Form action={API.SITE_CONFIG} method="post" onsuccess={() => setIsEdited(false)}>
        <div class="mx-auto">
          <PageHeader>
            <Show when={isEdited()}>
              <SubmitButton transitionId="site-config-save-btn">Save</SubmitButton>
            </Show>
            <PageTitle style={{ 'view-transition-name': 'site-config-title' }}>
              Site Config
            </PageTitle>
          </PageHeader>
        </div>
        <Checkbox
          name="tradingIsEnabled"
          label="Enable Trading?"
          value={props.tradingIsEnabled}
          setValue={() => setIsEdited(true)}
        />
        <Select
          name="base-rarity"
          label="Base Rarity for Design Previews"
          value={rarity()}
          setValue={(val) => {
            setIsEdited(true);
            setRarity(val);
          }}
          options={props.rarities.map((rarity) => {
            const value = new URLSearchParams({
              rarityId: rarity.rarityId,
              frameUrl: rarity.frameUrl,
              rarityColor: rarity.rarityColor,
              rarityName: rarity.rarityName,
            }).toString();
            return { value, label: rarity.rarityName };
          })}
        />
        <RarityRanking
          rarities={props.rarities}
          initialRanking={props.initialRanking}
          setIsEdited={() => setIsEdited(true)}
        />
        <Table
          search={{
            label: 'Search Events',
            column: 'event',
          }}
          columns={[
            {
              name: 'event',
              label: 'Event',
              font: 'title',
              width: '66%',
            },
            {
              name: 'packType',
              label: 'Pack Type',
              sort: false,
            },
          ]}
          rows={[
            {
              event: '5 Gift Subs',
              packType: {
                element: (
                  <TwitchEventSelect
                    twitchEvent={props.giftSubEvent}
                    packTypes={props.packTypes}
                    onChange={() => {
                      setIsEdited(true);
                    }}
                  />
                ),
                value: '',
              },
            },
            ...props.twitchEvents.map((event) => ({
              event: `Reward: ${event.eventName}`,
              packType: {
                element: (
                  <TwitchEventSelect
                    twitchEvent={event}
                    packTypes={props.packTypes}
                    onChange={() => {
                      setIsEdited(true);
                    }}
                  />
                ),
                value: '',
              },
            })),
          ]}
        />
      </Form>
    </>
  );
}

function TwitchEventSelect(props: {
  twitchEvent: TwitchEvent;
  packTypes: PackType[];
  onChange?: (val: string) => void;
}) {
  const value = () =>
    JSON.stringify({
      packTypeId: props.twitchEvent.packTypeId ?? '',
      packTypeName: props.twitchEvent.packTypeName ?? '',
    });

  return (
    <Select
      name={`event-type-${props.twitchEvent.eventId}`}
      value={value()}
      setValue={(val) => {
        console.log(val);
        props.onChange?.(val);
      }}
      options={[
        {
          label: 'None',
          value: JSON.stringify({
            packTypeId: '',
            packTypeName: '',
          }),
        },
        ...props.packTypes.map((packType) => ({
          label: packType.packTypeName,
          value: JSON.stringify({
            packTypeId: packType.packTypeId,
            packTypeName: packType.packTypeName,
          }),
        })),
      ]}
    />
  );
}
