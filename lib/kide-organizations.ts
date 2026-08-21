export type KideFeedKind = 'event';

export interface KideOrganization {
  id: string;
  name: string;
  description?: string;
  feedKinds?: KideFeedKind[];
}

export interface KideOrganizationCategory {
  id: string;
  name: string;
  description?: string;
  organizations: KideOrganization[];
}

function alphabeticalSort(first: string, second: string) {
  return first.localeCompare(second, 'fi', { sensitivity: 'base' });
}

export const kideOrganizationCategories = [
  {
    id: 'jamk',
    name: 'JAMK',
    description: 'Current organizations live under this top category.',
    organizations: [
      {
        id: '04e9e566-3aa0-4c0b-b3f8-19b8eb42bcd6',
        name: 'Konkurssi ry',
        description: 'Jyväskylän tradenomiopiskelijat ry',
        feedKinds: ['event'],
      },
      {
        id: '5e285e40-b716-424d-b04f-5c57e8868f50',
        name: 'JASTO RY',
        feedKinds: ['event'],
      },
      {
        id: '35e98493-3864-45c8-83da-5ee0782d98e0',
        name: 'JIO ry',
        feedKinds: ['event'],
      },
      {
        id: '2271f117-0caa-4798-94f6-15141dc0304f',
        name: 'MatkaRaTa',
        feedKinds: ['event'],
      },
      {
        id: 'a500e286-e5d1-4ede-8fac-b8f370a4b6d1',
        name: 'TARMO RY',
        feedKinds: ['event'],
      },
      {
        id: '80ccd7f1-961d-4343-b053-f12adc0f32b6',
        name: 'Jammaus Ry',
        feedKinds: ['event'],
      },
      {
        id: '9475b554-bf26-41f8-907f-b0923ff5639a',
        name: 'Opiskelijakunta JAMKO',
        feedKinds: ['event'],
      },
    ],
  },
  {
    id: 'jyu',
    name: 'JYU',
    description: 'University organizations and student communities.',
    organizations: [
      {
        id: 'e717ede9-5485-441f-a6be-ac6bfff883ff',
        name: 'Jyväskylän yliopiston ylioppilaskunta - JYY',
        feedKinds: ['event'],
      },
      {
        id: '69a2e680-8c00-483a-b584-34d3e958a8b7',
        name: 'Abakus ry',
        feedKinds: ['event'],
      },
      {
        id: '708712a0-9cbc-46dc-a2d4-3e55f5097805',
        name: 'Ainejärjestö Astérix ry',
        feedKinds: ['event'],
      },
      {
        id: '7047c9de-ad2b-4beb-b875-19576b179913',
        name: 'Ainejärjestö Sputnik ry',
        feedKinds: ['event'],
      },
      {
        id: '56059c50-ac32-4678-b061-a6bba8369761',
        name: 'Algo ry',
        feedKinds: ['event'],
      },
      {
        id: 'ebe645d0-3f5c-41a4-b2f0-4a0d12fccbdf',
        name: 'Cogito ry',
        feedKinds: ['event'],
      },
      {
        id: '08ad98be-ae51-4886-bbc7-6174b50dbc2c',
        name: 'Concordia Jyväskylä ry',
        feedKinds: ['event'],
      },
      {
        id: 'bcaa59c8-b558-49ff-848c-d25b2060a5e1',
        name: 'Corpus ry',
        feedKinds: ['event'],
      },
      {
        id: '6faa9f34-4421-426f-ab93-703c2b0795db',
        name: 'Dumppi ry',
        feedKinds: ['event'],
      },
      {
        id: 'ccc7de0b-7c3b-45f3-be68-0f8f7672c05d',
        name: 'Emile ry',
        feedKinds: ['event'],
      },
      {
        id: 'abab9687-b673-4bdf-8a01-55fa60d828d0',
        name: 'Fokus ry',
        feedKinds: ['event'],
      },
      {
        id: 'b5e99950-6968-4974-b279-29dfba73b1aa',
        name: 'Interventio ry',
        feedKinds: ['event'],
      },
      {
        id: '2b078a14-b3b7-4ff1-bd09-b9ffdc2fde6a',
        name: 'JANO ry',
        feedKinds: ['event'],
      },
      {
        id: '59513c2d-fb29-4087-8103-56a4d07ecf43',
        name: 'Jyväskylän Teekkariyhdistys JYTY',
        feedKinds: ['event'],
      },
      {
        id: '2225b1ab-e5b8-4c53-beba-cbceb3e714e3',
        name: 'Lingviestit',
        feedKinds: ['event'],
      },
      {
        id: '229fef27-0164-4835-a9da-f30d3aa08ff0',
        name: 'Linkki Jyväskylä ry',
        feedKinds: ['event'],
      },
      {
        id: 'a879df49-00be-445d-9f02-6e9544eabaaa',
        name: 'Lööppi ry',
        feedKinds: ['event'],
      },
      {
        id: '16bc9c95-6c16-457b-b8e4-6e9a97370262',
        name: 'Magna Carta ry',
        feedKinds: ['event'],
      },
      {
        id: '88639152-6de0-4708-b907-bdde43e14ea7',
        name: 'Nefa-Jyväskylä ry.',
        feedKinds: ['event'],
      },
      {
        id: '6f6b214b-c772-4cf8-b364-1514b998a4f7',
        name: 'Parku ry',
        feedKinds: ['event'],
      },
      {
        id: '6f56f7e3-fc1c-49a5-89cc-49eefd09feff',
        name: 'Pedaali ry',
        feedKinds: ['event'],
      },
      {
        id: '51c9f767-9537-4742-b1fd-81e5ed3f579b',
        name: 'Pedago ry',
        feedKinds: ['event'],
      },
      {
        id: '2c430afb-7388-44bc-af67-4e3127f454c1',
        name: 'Puolue ry',
        feedKinds: ['event'],
      },
      {
        id: '0e1e08cf-ce89-402e-98ba-fd98a0d15838',
        name: 'Pörssi ry',
        feedKinds: ['event'],
      },
      {
        id: '1c057022-fe89-41c2-8226-3c0c48d8c8c5',
        name: 'Radikaali',
        feedKinds: ['event'],
      },
      {
        id: '9d9b0cf1-6c20-48bb-a696-f27cb90e8b34',
        name: 'Sane ry',
        feedKinds: ['event'],
      },
      {
        id: '9b6205b4-032f-49fb-801b-dc7b8134a769',
        name: 'Sporticus ry',
        feedKinds: ['event'],
      },
      {
        id: '38e108c7-db3b-44c5-afdf-2ca369abddd8',
        name: 'Stimulus ry',
        feedKinds: ['event'],
      },
      {
        id: '2bf5bb19-530a-48eb-ad27-3caafb0e4b66',
        name: 'Sturm und Drang ry',
        feedKinds: ['event'],
      },
      {
        id: '623a9be8-dc95-4c9d-b05e-a8b7aeeb59d4',
        name: 'Svenska Klubben ry',
        feedKinds: ['event'],
      },
      {
        id: 'fc3d03d8-53d7-4aef-89ba-c2f4b19c1ca0',
        name: 'Syrinx Ry',
        feedKinds: ['event'],
      },
      {
        id: 'b957bf92-12ce-4f62-958c-7907c5cb4b26',
        name: 'Tosine ry',
        feedKinds: ['event'],
      },
      {
        id: 'c7d7f3ab-fa80-428f-a6b2-3ec6897e6efb',
        name: 'Trioli ry',
        feedKinds: ['event'],
      },
      {
        id: '17a7855d-ce1b-4e86-b7ca-6e11e1780c05',
        name: 'Varkaat Ry',
        feedKinds: ['event'],
      },
      {
        id: '9e76bfb1-8450-4e84-b58b-07e1ca9d27d4',
        name: 'Ynnä ry',
        feedKinds: ['event'],
      },
    ],
  },
] satisfies readonly KideOrganizationCategory[];

export const kideOrganizations = kideOrganizationCategories.flatMap(
  (category) => category.organizations,
);

export const sortedKideOrganizationCategories = [...kideOrganizationCategories]
  .map((category) => ({
    ...category,
    organizations: [...category.organizations].sort((first, second) =>
      alphabeticalSort(first.name, second.name),
    ),
  }))
  .sort((first, second) => alphabeticalSort(first.name, second.name));

export const sortedKideOrganizations = sortedKideOrganizationCategories.flatMap(
  (category) => category.organizations,
);
