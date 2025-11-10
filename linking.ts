import * as Linking from 'expo-linking';

export const prefixes = [
  Linking.createURL('/'),
  'gearted://',
  'https://app.gearted.com',
];

export const config = {
  screens: {
    LinkConsume: 'link/consume',
  },
};
